<?php

declare(strict_types=1);

/** Snapshot of selected standalone report functions from Cotativa Pavibem.
 * Public synthetic CI only: do not use this package as a live report service.
 * Source carries no client/project records, credentials or secrets.
 */

function pav_money(float $value): string {return 'R$ '.number_format($value,2,',','.');}
/** Valores acordados para diárias de prestadores Pavibem; a hora-base usa 8 horas. */

function pav_report_rows(array $report): array {
    $rows=[['Funcionário','Função','Diárias normais','Domingos/Feriados','Horas extras',
      'Diárias normais R$','Dom./Fer. R$','Extras R$','Total bruto R$','Pago Pavibem R$','Saldo funcionário R$','Reembolsável R$']];
    foreach($report['workers'] as $w){
        $rows[]=[
          (string)$w['name'],(string)$w['role'],(float)$w['normal_days'],
          (float)$w['premium_days'],(float)$w['extra_hours'],(float)$w['normal_total'],
          (float)$w['premium_total'],(float)$w['extra_total'],(float)$w['gross'],
          (float)$w['paid_by_pavibem'],(float)$w['net_due'],(float)$w['reimbursable']
        ];
    }
    $t=$report['totals'];
    $rows[]=['TOTAL GERAL','','','','',(float)$t['normal_total'],(float)$t['premium_total'],
      (float)$t['extra_total'],(float)$t['gross'],(float)$t['paid_by_pavibem'],
      (float)$t['net_due'],(float)$t['reimbursable']];
    return $rows;
}

function pav_export_xlsx(array $report,array $project,array $reimb): void {
    if(!class_exists('ZipArchive')){pav_export_csv($report,$project,$reimb);return;}
    $rows=[
      ['PAVIBEM - DEMONSTRATIVO DE DIÁRIAS E REEMBOLSO'],
      ['Obra', (string)($project['name']??'')],
      ['Empresa contratante',(string)($project['contractor']??'')],
      ['Período',substr($report['period_start'],0,10).' a '.substr($report['period_end'],0,10)],
      ['Status',!empty($report['export_audit']['ready'])
          ?(!empty($report['closed'])?'FECHADO / CONFERIDO':'PRELIMINAR / NÃO CONFERIDO')
          :'PRELIMINAR / FICHAS PENDENTES'],
      ['Total apurado (R$)',(float)$report['totals']['gross']],
      ['Pago pela Pavibem (R$)',(float)$report['totals']['paid_by_pavibem']],
      ['Valor reembolsável (R$)',(float)$report['totals']['reimbursable']],
      ['Reembolso solicitado (R$)',(float)$reimb['requested']],
      ['Reembolso recebido (R$)',(float)$reimb['received']],
      ['Saldo a receber da contratante (R$)',(float)$reimb['outstanding']],
      [''],
    ];
    foreach(pav_report_rows($report) as $row)$rows[]=$row;
    $sheet='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'.
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'.
      '<cols><col min="1" max="1" width="33" customWidth="1"/><col min="2" max="2" width="25" customWidth="1"/>'.
      '<col min="3" max="12" width="18" customWidth="1"/></cols><sheetData>';
    foreach($rows as $r=>$items){
        $rowNum=$r+1;$sheet.='<row r="'.$rowNum.'">';
        foreach($items as $c=>$v){
            $col='';$n=$c+1;while($n>0){$mod=($n-1)%26;$col=chr(65+$mod).$col;$n=intdiv($n-1,26);}
            $address=$col.$rowNum;
            $style=($r===0||$r===12||$r===count($rows)-1)?1:0;
            // Colunas D/F: quantidade e valor, em vermelho no Excel.
            $premiumColumn=$r>=12 && ($c===3||$c===6);
            if(is_numeric($v)&&!is_string($v)){
                $cellStyle=$premiumColumn?3:2;
                $sheet.='<c r="'.$address.'" s="'.$cellStyle.'"><v>'.number_format((float)$v,2,'.','').'</v></c>';
            }else {
                $safe=htmlspecialchars((string)$v,ENT_XML1|ENT_QUOTES,'UTF-8');
                $cellStyle=$premiumColumn?4:$style;
                $sheet.='<c r="'.$address.'" s="'.$cellStyle.'" t="inlineStr"><is><t xml:space="preserve">'.$safe.'</t></is></c>';
            }
        }
        $sheet.='</row>';
    }
    $sheet.='</sheetData></worksheet>';
    $tmp=tempnam(sys_get_temp_dir(),'pavx');
    if($tmp===false)throw new RuntimeException('Falha ao preparar planilha.');
    $zip=new ZipArchive();
    if($zip->open($tmp,ZipArchive::OVERWRITE)!==true){@unlink($tmp);throw new RuntimeException('Falha ao gerar XLSX.');}
    $zip->addFromString('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'.
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'.
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'.
      '<Default Extension="xml" ContentType="application/xml"/>'.
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'.
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'.
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>');
    $zip->addFromString('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?>'.
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'.
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    $zip->addFromString('xl/workbook.xml','<?xml version="1.0" encoding="UTF-8"?>'.
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'.
      ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'.
      '<sheets><sheet name="Diárias Pavibem" sheetId="1" r:id="rId1"/></sheets></workbook>');
    $zip->addFromString('xl/_rels/workbook.xml.rels','<?xml version="1.0" encoding="UTF-8"?>'.
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'.
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'.
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
    $zip->addFromString('xl/styles.xml','<?xml version="1.0" encoding="UTF-8"?>'.
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'.
      '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font>'.
      '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'.
      '<font><b/><sz val="11"/><color rgb="FFC02A36"/><name val="Calibri"/></font></fonts>'.
      '<fills count="4"><fill><patternFill patternType="none"/></fill>'.
      '<fill><patternFill patternType="gray125"/></fill>'.
      '<fill><patternFill patternType="solid"><fgColor rgb="FF17385B"/><bgColor indexed="64"/></patternFill></fill>'.
      '<fill><patternFill patternType="solid"><fgColor rgb="FFFFE5E5"/><bgColor indexed="64"/></patternFill></fill></fills>'.
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'.
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'.
      '<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'.
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'.
      '<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>'.
      '<xf numFmtId="4" fontId="2" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>'.
      '<xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>');
    $zip->addFromString('xl/worksheets/sheet1.xml',$sheet);$zip->close();
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="pavibem-diarias-'.$report['period_start'].'.xlsx"');
    header('Cache-Control: no-store');header('Content-Length: '.filesize($tmp));
    readfile($tmp);@unlink($tmp);exit;
}

function pav_export_csv(array $report,array $project,array $reimb): void {
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="pavibem-diarias-'.$report['period_start'].'.csv"');
    header('Cache-Control: no-store');
    $o=fopen('php://output','w');fwrite($o,"\xEF\xBB\xBF");
    fputcsv($o,['Pavibem','Obra',$project['name']??'','Contratante',$project['contractor']??''],';');
    foreach(pav_report_rows($report) as $row)fputcsv($o,array_map(static fn($x)=>is_numeric($x)?str_replace('.',',',(string)$x):(string)$x,$row),';');
    fclose($o);exit;
}

function pav_pdf_text(string $text,int $max=36): string {
    $text=mb_strimwidth($text,0,$max,'...','UTF-8');
    $v=@iconv('UTF-8','Windows-1252//TRANSLIT',$text);
    return str_replace(['\\','(',')',"\r","\n"],['\\\\','\\(','\\)',' ',' '],$v!==false?$v:$text);
}
/**
 * Monta as seções do PDF sem transportar dados de contato, Pix ou anexos.
 * Ordenação: função e, dentro dela, nome completo (case-insensitive).
 */
/**
 * Domingos e feriados são exibidos separadamente, sem dupla contagem:
 * quando a data é ambos, atribuímos a diária ao grupo "feriados".
 */

function pav_pdf_report(array $report,array $project,array $reimb,bool $showValues=false): void {
    $groups=pav_pdf_groups($report);
    $rows=[];
    foreach($groups as $group){
        $rows[]=['kind'=>'group','title'=>$group['role']];
        foreach($group['workers'] as $worker)
            $rows[]=['kind'=>'worker','worker'=>$worker,'role'=>$group['role']];
        $rows[]=['kind'=>'subtotal','group'=>$group];
    }
    $pages=[['kind'=>'summary','rows'=>[]]];
    // Sete fichas detalhadas por página garantem espaço para datas e totais por função.
    $details=[];$pageRows=[];$heightUsed=0;$role='';
    foreach($rows as $row){
        $rowHeight=($row['kind']==='worker')?92:34;
        if($pageRows && $heightUsed+$rowHeight>522){
            $details[]=$pageRows;$pageRows=[];$heightUsed=0;
            if($row['kind']==='worker'){
                $pageRows[]=['kind'=>'group','title'=>$row['role'].' (continuação)'];
                $heightUsed+=34;
            }
        }
        if($row['kind']==='group')$role=$row['title'];
        $pageRows[]=$row;$heightUsed+=$rowHeight;
    }
    if($pageRows)$details[]=$pageRows;
    foreach($details as $detail)$pages[]=['kind'=>'detail','rows'=>$detail];
    $pageCount=count($pages);
    $contents=[];
    $fmt=static fn(float $n):string=>number_format($n,1,',','.');
    $money=static fn(float $n):string=>pav_money($n);
    $sumNormal=0.0;$sumSpecial=0.0;$sumSunday=0.0;$sumHoliday=0.0;$sumOther=0.0;$sumExtra=0.0;
    foreach($groups as $g){
        $sumNormal+=$g['normal'];$sumSpecial+=$g['special'];
        $sumSunday+=$g['sunday'];$sumHoliday+=$g['holiday'];$sumOther+=$g['other'];
        $sumExtra+=$g['extra'];
    }
    foreach($pages as $index=>$page){
        $stream='';
        $write=static function(float $x,float $y,string $label,int $size=9,bool $bold=false,
            bool $muted=false,int $max=110,bool $red=false)use(&$stream):void{
            $font=$bold?'F2':'F1';$safe=pav_pdf_text($label,$max);
            $ink=$red?'0.72 0.13 0.17':($muted?'0.38 0.47 0.56':'0.08 0.17 0.27');
            $stream.="BT /$font $size Tf $ink rg 1 0 0 1 $x $y Tm ($safe) Tj ET\n";
        };
        $rule=static function(float $y)use(&$stream):void{
            $stream.="0.88 0.91 0.94 RG 34 $y m 561 $y l S\n";
        };
        $stream.="0.06 0.16 0.28 rg 0 754 595 88 re f\n";
        $stream.="BT /F1 9 Tf 0.72 0.85 0.92 rg 1 0 0 1 35 816 Tm (".pav_pdf_text('RELATÓRIO GERENCIAL').") Tj ET\n";
        $stream.="BT /F2 20 Tf 1 1 1 rg 1 0 0 1 35 789 Tm (".pav_pdf_text('Controle de Mão de Obra').") Tj ET\n";
        $stream.="BT /F1 8 Tf 0.72 0.85 0.92 rg 1 0 0 1 35 770 Tm (".pav_pdf_text('Contratante • Obra • Período de referência').") Tj ET\n";
        $stream.="BT /F2 11 Tf 1 1 1 rg 1 0 0 1 475 817 Tm (PAVIBEM) Tj ET\n";
        // Ícone de documento em traços vetoriais, sem fotografia nem imagem externa.
        $stream.="q 0.78 0.89 0.95 RG 1.5 w 550 785 19 26 re S 554 802 m 565 802 l S 554 796 m 565 796 l S 554 790 m 562 790 l S Q\n";
        $stream.="0.14 0.60 0.50 rg 34 757 70 3 re f\n";
        $write(35,735,'Obra: '.(string)($project['name']??'Não informada'),10,true,false,78);
        $write(35,717,'Contratante: '.(string)($project['contractor']??'Não informada'),9,false,false,85);
        $periodLabel=date('d/m/Y',strtotime((string)($report['period_start']??''))).
            ' a '.date('d/m/Y',strtotime((string)($report['period_end']??'')));
        $write(35,699,'Período real: '.$periodLabel,9);
        $safeToClose=!empty($report['closed']) &&
            !empty($report['export_audit']['ready']);
        $write(400,735,$safeToClose?'CONFERIDO':'PRELIMINAR',9,true);
        $write(400,717,$showValues?'CONTROLE INTERNO':'SEM VALORES FINANCEIROS',8,true);
        if($page['kind']==='summary'){
            $stream.="0.94 0.97 0.99 rg 30 585 535 88 re f\n";
            foreach([
                ['FUNCIONÁRIOS',(string)count((array)($report['workers']??[])),40],
                ['TOTAL DIÁRIAS',$fmt($sumNormal+$sumSpecial),145],
                ['DOMINGOS',$fmt($sumSunday),250],
                ['FERIADOS',$fmt($sumHoliday),356],
                ['HORAS EXTRAS',$fmt($sumExtra),462],
            ] as [$label,$value,$x]){
                $write((float)$x,651,(string)$label,8,true,true);
                $write((float)$x,620,(string)$value,20,true,false,110,
                    in_array($label,['DOMINGOS','FERIADOS'],true));
            }
            $write(35,555,'RESUMO POR FUNÇÃO',12,true);
            $stream.="0.89 0.93 0.96 rg 30 515 535 26 re f\n";
            foreach([['FUNÇÃO',36],['EQUIPE',264],['DIÁRIAS',315],['DOM.',370],
                ['FER.',423],['H. EXTRAS',490]] as [$label,$x])
                $write((float)$x,525,(string)$label,7,true,false,110,
                    in_array($label,['DOM.','FER.'],true));
            $y=497;
            foreach($groups as $group){
                $write(36,$y,$group['role'],9,true,false,45);
                $write(267,$y,(string)count($group['workers']),9);
                $write(315,$y,$fmt($group['normal']+$group['special']),9);
                $write(372,$y,$fmt($group['sunday']),9,false,false,110,true);
                $write(425,$y,$fmt($group['holiday']),9,false,false,110,true);
                $write(496,$y,$fmt($group['extra']),9);
                $rule($y-9);$y-=26;
            }
            $write(36,$y-6,'TOTAL GERAL',9,true);
            $write(267,$y-6,(string)count((array)($report['workers']??[])),9,true);
            $write(315,$y-6,$fmt($sumNormal+$sumSpecial),9,true);
            $write(372,$y-6,$fmt($sumSunday),9,true,false,110,true);
            $write(425,$y-6,$fmt($sumHoliday),9,true,false,110,true);
            $write(496,$y-6,$fmt($sumExtra),9,true);
            if($showValues){
                $t=(array)($report['totals']??[]);
                $write(36,max(155,$y-57),'Apurado: '.$money((float)($t['gross']??0)),9,true);
                $write(220,max(155,$y-57),'Pago: '.$money((float)($t['paid_by_pavibem']??0)),9,true);
                $write(387,max(155,$y-57),'Reembolsável: '.$money((float)($t['reimbursable']??0)),9,true);
            }
            if(empty($report['export_audit']['ready'])){
                $write(36,168,'ATENÇÃO: RELATÓRIO PRELIMINAR — fichas aguardam conferência.',9,true,false,100);
                $reasons=(array)($report['export_audit']['reasons']??[]);
                $write(36,151,implode(' | ',array_slice($reasons,0,2)),8,false,true,120);
            }
            $write(36,114,'Domingos e feriados já estão incluídos no total de diárias (sem duplicação).',8,false,true);
            $write(36,99,'Se o feriado cair em domingo, a diária aparece somente na coluna Feriados.',8,false,true);
            if($sumOther>0)$write(36,84,'Outras diárias especiais sem classificação: '.$fmt($sumOther),8,false,true);
        }else{
            $write(36,667,'RELAÇÃO DE FUNCIONÁRIOS · POR FUNÇÃO E ORDEM ALFABÉTICA',9,true);
            $stream.="0.89 0.93 0.96 rg 30 626 535 26 re f\n";
            foreach([['FUNCIONÁRIO',36],['NORMAL',289],['DOM.',355],['FER.',399],['DIÁRIAS',449],['H. EXTRAS',514]] as [$label,$x])
                $write((float)$x,635,(string)$label,7,true,false,110,
                    in_array($label,['DOM.','FER.'],true));
            $y=601;
            foreach($page['rows'] as $entry){
                if($entry['kind']==='group'){
                    $stream.="0.91 0.96 0.95 rg 30 ".($y-10)." 535 29 re f\n";
                    $write(36,$y,'FUNÇÃO: '.mb_strtoupper($entry['title'],'UTF-8'),10,true,false,66);
                    $y-=34;continue;
                }
                if($entry['kind']==='subtotal'){
                    $g=$entry['group'];
                    $write(36,$y,'Subtotal: '.$g['role'].' ('.count($g['workers']).' funcionários)',8,true,false,54);
                    $write(293,$y,$fmt($g['normal']),8,true);
                    $write(355,$y,$fmt($g['sunday']),8,true,false,110,true);
                    $write(401,$y,$fmt($g['holiday']),8,true,false,110,true);
                    $write(451,$y,$fmt($g['normal']+$g['special']),8,true);
                    $write(519,$y,$fmt($g['extra']),8,true);
                    if($showValues)$write(36,$y-12,'Apurado: '.$money($g['gross']).' | Pago: '.$money($g['paid']),7,false,true,100);
                    $rule($y-18);$y-=34;continue;
                }
                $w=$entry['worker'];
                $normal=(float)($w['normal_days']??0);$special=(float)($w['premium_days']??0);
                $counts=pav_pdf_day_counts($w);
                $write(36,$y,(string)($w['name']??'Sem nome'),9,true,false,48);
                $write(293,$y,$fmt($normal),9);
                $write(355,$y,$fmt($counts['sunday']),9,false,false,110,true);
                $write(401,$y,$fmt($counts['holiday']),9,false,false,110,true);
                $write(451,$y,$fmt($normal+$special),9);
                $write(519,$y,$fmt((float)($w['extra_hours']??0)),9);
                $worked=[];$sundayDates=[];$holidayDates=[];
                foreach((array)($w['days']??[]) as $day){
                    if((string)($day['type']??'')==='absence'||(float)($day['fraction']??0)<=0)continue;
                    $date=strtotime((string)($day['date']??''));if($date===false)continue;
                    $label=date('d/m',$date);
                    $worked[(string)$day['date']]=$label;
                    $calendar=function_exists('pav_day_meta')
                        ?pav_day_meta((string)$day['date'],(string)($day['type']??'normal')):null;
                    $isSunday=$calendar!==null?(bool)$calendar['sunday']:date('w',$date)==='0';
                    $isHoliday=$calendar!==null?(bool)$calendar['holiday']:
                        (string)($day['type']??'')==='holiday';
                    if($isHoliday)$holidayDates[(string)$day['date']]=$label;
                    elseif($isSunday)$sundayDates[(string)$day['date']]=$label;
                }
                ksort($worked);ksort($sundayDates);ksort($holidayDates);
                $worked=array_values($worked);
                $sundayDates=array_values($sundayDates);$holidayDates=array_values($holidayDates);
                foreach(array_chunk($worked,15) as $line=>$dates){
                    if($line>=2)break;
                    $write(43,$y-13-$line*11,($line===0?'Dias: ':'         ').implode(', ',$dates),7,false,true,112);
                }
                if(count($worked)>30)$write(43,$y-35,'Outras datas: '.implode(', ',array_slice($worked,30,15)),7,false,true,112);
                if($sundayDates)$write(43,$y-46,'Domingos: '.implode(', ',$sundayDates),7,false,false,112,true);
                if($holidayDates)$write(43,$y-58,'Feriados: '.implode(', ',$holidayDates),7,false,false,112,true);
                if($showValues)$write(303,$y-72,'Bruto: '.$money((float)($w['gross']??0)).
                    ' | Pago: '.$money((float)($w['paid_by_pavibem']??0)),7,false,true,77);
                if($counts['other']>0)$write(43,$y-72,'Especiais sem classificação: '.$fmt($counts['other']),7,false,true,60);
                $rule($y-81);$y-=92;
            }
        }
        $rule(63);
        $write(36,48,'PAVIBEM · Controle de mão de obra',8,true,true);
        $write(36,32,$showValues?'Uso interno e confidencial':'Relatório operacional sem remuneração individual',7,false,true);
        $write(486,48,'Página '.($index+1).' / '.$pageCount,8,true);
        $contents[]=$stream;
    }
    $objects=[1=>'<< /Type /Catalog /Pages 2 0 R >>'];$pageRefs=[];$next=3;
    foreach($contents as $content){
        $pageId=$next++;$streamId=$next++;$pageRefs[]=$pageId.' 0 R';
        $objects[$pageId]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 100 0 R /F2 101 0 R >> >> /Contents '.$streamId.' 0 R >>';
        $objects[$streamId]='<< /Length '.strlen($content)." >>\nstream\n".$content."\nendstream";
    }
    $objects[2]='<< /Type /Pages /Kids ['.implode(' ',$pageRefs).'] /Count '.count($contents).' >>';
    $objects[100]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    $objects[101]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    ksort($objects);$pdf="%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";$offsets=[0];
    foreach($objects as $id=>$body){$offsets[$id]=strlen($pdf);$pdf.=$id." 0 obj\n".$body."\nendobj\n";}
    $xref=strlen($pdf);$pdf.="xref\n0 102\n0000000000 65535 f \n";
    for($i=1;$i<=101;$i++)$pdf.=isset($offsets[$i])?sprintf('%010d 00000 n ',$offsets[$i])."\n":"0000000000 65535 f \n";
    $pdf.="trailer\n<< /Size 102 /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF\n";
    header('Content-Type: application/pdf');
    header('X-Content-Type-Options: nosniff');
    header('Content-Disposition: attachment; filename="pavibem-mao-de-obra-'.
        (empty($report['export_audit']['ready'])?'PRELIMINAR-':'').
        ($showValues?'interno-':'externo-').$report['period_start'].'.pdf"');
    header('Cache-Control: private, no-store');
    header('Content-Length: '.strlen($pdf));
    echo $pdf;exit;
}
