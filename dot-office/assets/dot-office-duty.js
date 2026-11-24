/**
 * Cotativa Office Engine 2 — Duty Resolver
 * Release: v4.17.0
 *
 * Inspired by the duty-priority architecture of Hermes Virtual Office (MIT):
 * a body has one authoritative duty, and higher-priority duties preempt lower
 * ones. Cotativa backend jobs remain the source of truth.
 */

export const DOT_DUTY=Object.freeze({
  DISABLED:'disabled',
  MEETING:'meeting',
  SUPERVISE:'supervise',
  WORK:'work',
  REVIEW:'review',
  STANDBY:'standby',
  IDLE:'idle'
});

export const DOT_DUTY_PRIORITY=Object.freeze({
  disabled:1000,
  meeting:100,
  supervise:95,
  work:90,
  review:70,
  standby:30,
  idle:10
});

function statusText(input){
  return String(input||'').trim().toLowerCase();
}

export function resolveDotDuty(input={}){
  if(input.enabled===false)return DOT_DUTY.DISABLED;

  if(input.meeting===true)return DOT_DUTY.MEETING;

  if(input.isManager===true){
    if(input.supervisorBusy===true)return DOT_DUTY.SUPERVISE;
    if(Number(input.jobId||0)>0)return DOT_DUTY.WORK;
    return DOT_DUTY.STANDBY;
  }

  if(Number(input.jobId||0)>0)return DOT_DUTY.WORK;

  const status=statusText(input.jobStatus);
  if(
    input.reviewRequested===true||
    ['review','blocked','waiting_user','needs_user'].includes(status)
  )return DOT_DUTY.REVIEW;

  if(Number(input.queueDepth||0)>0)return DOT_DUTY.STANDBY;
  return DOT_DUTY.IDLE;
}

export function dutyCanPreempt(current,next){
  const a=DOT_DUTY_PRIORITY[String(current||DOT_DUTY.IDLE)]??0;
  const b=DOT_DUTY_PRIORITY[String(next||DOT_DUTY.IDLE)]??0;
  return b>=a;
}

export function dutyLabel(duty){
  return ({
    disabled:'Desativado',
    meeting:'Em reunião',
    supervise:'Supervisionando',
    work:'Trabalhando',
    review:'Revisando',
    standby:'Em prontidão',
    idle:'Livre'
  })[String(duty||'')]||'Livre';
}
