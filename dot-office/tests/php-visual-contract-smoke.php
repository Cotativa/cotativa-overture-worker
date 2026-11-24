<?php

declare(strict_types=1);

require dirname(__DIR__).'/php/visual-contract.php';

function assert_public_contract(bool $ok,string $message): void
{
    if(!$ok) throw new RuntimeException($message);
}

$sample=dot_office_visual_sample();
assert_public_contract(count($sample['agents'])===14,'Expected 14 synthetic agents.');
assert_public_contract(count(array_unique(array_column($sample['agents'],'id')))===14,'Unique agent IDs required.');
assert_public_contract(count(array_filter($sample['agents'],static fn($a)=>$a['current_job_id']!==0))===0,'Synthetic agents must start idle.');
$counts=[];
foreach($sample['agents'] as $a){
    $key=$a['station'];
    $counts[$key]=($counts[$key]??0)+1;
}
assert_public_contract($counts===['manager'=>1,'operations'=>3,'social'=>2,'content'=>3,'seo'=>3,'engineering'=>2],'Department counts must match 3D plan.');

$payload=$sample;
$payload['agents'][0]['name']='</script><script>alert("XSS")</script> & \' evil';
$json=dot_office_visual_encode_json($payload);
assert_public_contract(!str_contains($json,'</script>'),'Unsafe raw close-script token.');
assert_public_contract(!str_contains($json,'<script>'),'Unsafe opening script token.');
assert_public_contract(!str_contains($json,'&'),'Unsafe ampersand.');
assert_public_contract(!str_contains($json,'\''),'Unsafe apostrophe.');
assert_public_contract(isset(json_decode($json,true,512,JSON_THROW_ON_ERROR)['agents'][0]),'Encoded JSON must decode.');
echo "DOT_OFFICE_PUBLIC_PHP_CONTRACT_OK\n";
