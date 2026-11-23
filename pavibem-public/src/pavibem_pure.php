<?php

declare(strict_types=1);

/**
 * Cotativa public Pavibem pure validation functions.
 * Extracted from the private PHP source on 2026-11-22.
 * No DB, credentials, worker records, commercial rates or real projects.
 * Regenerate through audited code review when upstream functions change.
 */

// Upstream: admin/app/pavibem_diarias.php
function pav_decimal(mixed $value): ?float
{
    if($value===null || trim((string)$value)==='') return null;
    if(is_int($value)||is_float($value)) return round((float)$value,2);
    $s=trim((string)$value);
    $s=preg_replace('/[^\d,.\-]/u','',$s)??'';
    if($s==='')return null;
    if(str_contains($s,','))$s=str_replace(',','. ',str_replace('.','',$s));
    $s=str_replace(' ','',$s);
    if(!is_numeric($s))throw new RuntimeException('Valor numérico inválido.');
    return round((float)$s,2);
}

function pav_date(mixed $value): string
{
    $v=trim((string)$value);
    if(!preg_match('/^\d{4}-\d{2}-\d{2}$/',$v))throw new RuntimeException('Data inválida: use dia/mês/ano do calendário.');
    $d=DateTimeImmutable::createFromFormat('!Y-m-d',$v);
    if(!$d||$d->format('Y-m-d')!==$v)throw new RuntimeException('Data inválida.');
    return $v;
}

function pav_month(string $month): array
{
    if(!preg_match('/^\d{4}-\d{2}$/',$month))$month=date('Y-m');
    $first=DateTimeImmutable::createFromFormat('!Y-m-d',$month.'-01');
    if(!$first||$first->format('Y-m')!==$month)$first=new DateTimeImmutable('first day of this month');
    return [$first->format('Y-m-d'),$first->format('Y-m-t'),$first->format('Y-m')];
}

// Upstream: admin/app/pavibem_calendar.php
function pav_national_holiday_label(string $date): ?string
{
    if(!preg_match('/^\d{4}-(\d{2})-(\d{2})$/',$date,$m))return null;
    // Feriados nacionais de data fixa. Pontos facultativos NÃO estão incluídos.
    $fixed=[
      '01-01'=>'Confraternização Universal',
      '04-21'=>'Tiradentes',
      '05-01'=>'Dia do Trabalho',
      '09-07'=>'Independência do Brasil',
      '10-12'=>'Nossa Senhora Aparecida',
      '11-02'=>'Finados',
      '11-15'=>'Proclamação da República',
      '11-20'=>'Consciência Negra',
      '12-25'=>'Natal',
    ];
    return $fixed[$m[1].'-'.$m[2]]??null;
}

function pav_day_meta(string $date,string $dayType='normal'): array
{
    $date=trim($date);
    $d=DateTimeImmutable::createFromFormat('!Y-m-d',$date);
    $valid=$d!==false && $d->format('Y-m-d')===$date;
    if(!$valid)return ['valid'=>false,'sunday'=>false,'holiday'=>false,
        'premium'=>$dayType==='holiday'||$dayType==='sunday',
        'label'=>'Data a conferir'];
    $sunday=$d->format('w')==='0';
    $holiday=pav_national_holiday_label($date);
    $manualHoliday=$dayType==='holiday';
    $premium=$sunday||$holiday!==null||$manualHoliday||$dayType==='sunday';
    $label=$holiday!==null?'Feriado nacional: '.$holiday:
      ($manualHoliday?'Feriado informado manualmente':($sunday?'Domingo':
      ($dayType==='sunday'?'Domingo informado manualmente':'Dia normal')));
    if($dayType==='absence')$label.=' · falta (sem diária)';
    return ['valid'=>true,'sunday'=>$sunday,'holiday'=>$holiday!==null||$manualHoliday,
        'premium'=>$premium,'label'=>$label];
}

function pav_period_special_days(string $start,string $end): array
{
    $list=[];$from=new DateTimeImmutable($start);$to=new DateTimeImmutable($end);
    for($d=$from;$d<=$to;$d=$d->modify('+1 day')){
        $iso=$d->format('Y-m-d');$meta=pav_day_meta($iso);
        if($meta['premium'])$list[]=['date'=>$iso,'label'=>$meta['label']];
    }
    return $list;
}

// Upstream: admin/app/pavibem_exports.php
function pav_pdf_day_counts(array $worker): array {
    $sunday=0.0;$holiday=0.0;$other=0.0;
    foreach((array)($worker['days']??[]) as $day){
        $type=(string)($day['type']??'normal');
        $fraction=(float)($day['fraction']??0);
        if($type==='absence'||$fraction<=0)continue;
        $date=(string)($day['date']??'');
        $calendar=function_exists('pav_day_meta')?pav_day_meta($date,$type):null;
        $ts=strtotime($date);
        $isSunday=$calendar!==null?(bool)$calendar['sunday']:
            ($type==='sunday'||($ts!==false && date('w',$ts)==='0'));
        $isHoliday=$calendar!==null?(bool)$calendar['holiday']:$type==='holiday';
        if($isHoliday)$holiday+=$fraction;
        elseif($isSunday)$sunday+=$fraction;
        elseif(!empty($day['premium']))$other+=$fraction;
    }
    $missing=(float)($worker['premium_days']??0)-$sunday-$holiday-$other;
    if($missing>0.005)$other+=$missing;
    return ['sunday'=>round($sunday,2),'holiday'=>round($holiday,2),
        'other'=>round($other,2)];
}

function pav_pdf_groups(array $report): array {
    $groups=[];
    foreach((array)($report['workers']??[]) as $worker){
        $role=trim((string)($worker['role']??''));if($role==='')$role='Sem função';
        $key=mb_strtolower($role,'UTF-8');
        if(!isset($groups[$key]))$groups[$key]=[
            'role'=>$role,'workers'=>[],'normal'=>0.0,'special'=>0.0,'sunday'=>0.0,
            'holiday'=>0.0,'other'=>0.0,'extra'=>0.0,
            'gross'=>0.0,'paid'=>0.0
        ];
        $groups[$key]['workers'][]=$worker;
        $groups[$key]['normal']+=(float)($worker['normal_days']??0);
        $groups[$key]['special']+=(float)($worker['premium_days']??0);
        $classification=pav_pdf_day_counts($worker);
        $groups[$key]['sunday']+=$classification['sunday'];
        $groups[$key]['holiday']+=$classification['holiday'];
        $groups[$key]['other']+=$classification['other'];
        $groups[$key]['extra']+=(float)($worker['extra_hours']??0);
        $groups[$key]['gross']+=(float)($worker['gross']??0);
        $groups[$key]['paid']+=(float)($worker['paid_by_pavibem']??0);
    }
    uasort($groups,static fn(array $a,array $b):int=>
        strcmp(mb_strtolower($a['role'],'UTF-8'),mb_strtolower($b['role'],'UTF-8')));
    foreach($groups as &$group){
        usort($group['workers'],static function(array $a,array $b):int{
            $compare=strcmp(mb_strtolower((string)($a['name']??''),'UTF-8'),
                mb_strtolower((string)($b['name']??''),'UTF-8'));
            return $compare?:((int)($a['id']??0)<=>(int)($b['id']??0));
        });
    }
    unset($group);
    return array_values($groups);
}

/**
 * PDF administrativo ou externo (padrão SEM valores).
 * Quando os valores estão desmarcados não são escritos no arquivo, nem ocultados por CSS.
 */
