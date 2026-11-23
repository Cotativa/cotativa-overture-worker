<?php
declare(strict_types=1);
require __DIR__.'/../src/pavibem_pure.php';
require __DIR__.'/../src/pavibem_reports.php';
$workers=[];
for($i=1;$i<=80;$i++){
    $workers[]=[
      'id'=>$i,'name'=>'Funcionário teste '.$i,'role'=>'Pintor',
      'normal_days'=>17,'premium_days'=>2,'extra_hours'=>0,
      'normal_total'=>3400,'premium_total'=>800,'extra_total'=>0,
      'gross'=>4200,'paid_by_pavibem'=>1000,'net_due'=>3200,'reimbursable'=>4200
    ];
}
$report=[
    'period_start'=>'2026-10-01','period_end'=>'2026-10-31',
    'workers'=>$workers,
    'totals'=>['normal_total'=>272000,'premium_total'=>64000,'extra_total'=>0,'gross'=>336000,
      'paid_by_pavibem'=>80000,'net_due'=>256000,'reimbursable'=>336000],
    'closed'=>false
];
$project=['name'=>'Obra teste - relatório 80 funcionários','contractor'=>'Contratante teste'];
$reimb=['requested'=>336000,'received'=>80000,'outstanding'=>256000];
if(($argv[1]??'pdf')==='xlsx')pav_export_xlsx($report,$project,$reimb);
pav_pdf_report($report,$project,$reimb,($argv[1]??'')==='pdf-interno');
