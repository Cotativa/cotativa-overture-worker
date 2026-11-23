<?php
declare(strict_types=1);
require dirname(__DIR__).'/src/pavibem_pure.php';

function must(bool $condition, string $reason): void {
    if (!$condition) throw new RuntimeException("Pavibem public guard failed: ".$reason);
}
function close_to(float $actual,float $expected,string $reason): void {
    must(abs($actual-$expected)<0.001,$reason.' got='.$actual.' expected='.$expected);
}

must(pav_decimal("R$ 1.600,00")===1600.0,'pt-BR money');
must(pav_decimal("200,50")===200.5,'fractional money');
must(pav_decimal(null)===null,'nullable value');
try { pav_decimal("não informado"); } catch (RuntimeException $e) { $invalidNumeric=true; }
must(!empty($invalidNumeric),'invalid value must be rejected');

must(pav_date("2026-02-28")==="2026-02-28",'valid date');
try { pav_date("2026-02-30"); } catch (RuntimeException $e) { $invalidDate=true; }
must(!empty($invalidDate),'invalid February date');
must(pav_month("2024-02")[1]==="2024-02-29",'leap year');
must(pav_month("2026-02")[1]==="2026-02-28",'normal year');
must(pav_month("2026-10")[1]==="2026-10-31",'month end');

must(pav_national_holiday_label('2026-10-12')!==null,'holiday list');
must(pav_national_holiday_label('2026-10-28')===null,'optional public-sector day is not federal holiday');
must(pav_day_meta('2026-11-01')['sunday']===true,'Sunday');
must(pav_day_meta('2026-11-02')['holiday']===true,'Finados');
must(pav_day_meta('2026-11-15')['holiday']===true,'Sunday which is also a holiday');
must(pav_day_meta('2026-10-28')['premium']===false,'ordinary weekday');
must(pav_day_meta('bad-date')['valid']===false,'bad date metadata');
must(pav_day_meta('2026-10-27','holiday')['premium']===true,'manual holiday flag');
must(pav_day_meta('2026-11-01','absence')['premium']===true,'Sunday absence classified premium, paid zero in counts');

$special=pav_period_special_days('2026-10-01','2026-11-04');
must(count($special)===7,'five Sundays and two standalone holidays in test period');
must(array_column($special,'date')===[
    '2026-10-04','2026-10-11','2026-10-12','2026-10-18',
    '2026-10-25','2026-11-01','2026-11-02'
],'cross-month days');

$worker=[
    'id'=>2,'name'=>'Pessoa Exemplo A','role'=>'Pintor',
    'normal_days'=>1,'premium_days'=>3,'extra_hours'=>4,'gross'=>0,
    'paid_by_pavibem'=>0,'days'=>[
        ['date'=>'2026-11-01','type'=>'normal','fraction'=>1,'premium'=>true],
        ['date'=>'2026-11-02','type'=>'holiday','fraction'=>1,'premium'=>true],
        ['date'=>'2026-11-15','type'=>'holiday','fraction'=>1,'premium'=>true],
        ['date'=>'2026-11-22','type'=>'absence','fraction'=>0,'premium'=>true]
    ],
];
$counts=pav_pdf_day_counts($worker);
must($counts===['sunday'=>1.0,'holiday'=>2.0,'other'=>0.0],'Sunday and holiday not double counted');
$another=['id'=>3,'name'=>'Pessoa Exemplo B','role'=>'Pintor','normal_days'=>2,'premium_days'=>0,'extra_hours'=>3];
$third=['id'=>1,'name'=>'Pessoa Exemplo C','role'=>'Pedreiro','normal_days'=>4,'premium_days'=>0,'extra_hours'=>2];
$groups=pav_pdf_groups(['workers'=>[$worker,$another,$third]]);
must(array_column($groups,'role')===['Pedreiro','Pintor'],'role sorted alphabetically');
must(array_column($groups[1]['workers'],'name')===['Pessoa Exemplo A','Pessoa Exemplo B'],'worker sorted alphabetically');
close_to($groups[1]['normal'],3,'normal days grouped');
close_to($groups[1]['extra'],7,'extra hours grouped');
close_to($groups[1]['sunday'],1,'Sundays grouped');
close_to($groups[1]['holiday'],2,'holidays grouped');

echo "PAVIBEM_PUBLIC_GUARD_OK: dates, monetary parsing, holidays, cross-month, grouping\n";
