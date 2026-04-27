/**
 * Seeds a sample AI suggestion for the "Mokopane Decline Restart Readiness" project
 * so the UI can be reviewed without a live API key.
 *
 * Run: npx tsx prisma/seed-ai-suggestions.ts
 */

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

const PROJECT_ID   = '3c22480c-d6a8-4582-bd6d-116618d936ed'
const ORG_ID       = '4305bb8d-6035-4166-8536-8ccdfe07c3e1'
const SEED_MODEL   = 'seed-data (demo)'

// Real deliverable IDs from the project
const D_CONTROL_ROOM  = '3935b4f1-ff11-45a6-b4c6-3e06b2881c49'  // PEO-ORG-002 — overdue
const D_VENTILATION   = '3fb3543e-29f2-4fe4-8187-3abce300ff59'  // INF-VENT-001 — due soon
const D_POWER         = '5c416dc3-6918-4956-b727-ed4265e2b250'  // INF-POWER-001 — due soon
const D_PROCEDURES    = '5c355890-00eb-4ec7-b5c9-a8f1c0d6e1eb'  // GOV-CONTROL-002 — overdue
const D_GRADE_CONTROL = '3d0f32ca-bd1b-4d27-bd15-fb90e7c05e23'  // HND-RAMP-002 — planned

// Real RAID item IDs
const R_DEWATERING  = 'fe147b96-04e8-4599-a032-7fc4595d7356'   // risk/high — dewatering panel delay

async function main() {
  // Remove existing seed suggestion to allow re-runs
  await prisma.aISuggestion.deleteMany({
    where: { projectId: PROJECT_ID, model: SEED_MODEL },
  })

  await prisma.aISuggestion.create({
    data: {
      organizationId: ORG_ID,
      projectId: PROJECT_ID,
      model: SEED_MODEL,
      promptVersion: '1',
      items: {
        create: [
          // ── Risks ─────────────────────────────────────────────────────────
          {
            type: 'risk',
            priority: 'high',
            title: 'Control room readiness overdue — restart milestone at risk',
            description:
              'PEO-ORG-002 "Control room roles and escalation process ready" has passed its target date (12 May 2026) and remains in progress. ' +
              'This deliverable is on the critical path for the restart; delay directly exposes the organisation to a regulatory non-compliance finding at inspection.',
            actionType: 'send_reminder',
            actionPayload: {
              deliverableId: D_CONTROL_ROOM,
              deliverableName: 'Control room roles and escalation process ready',
              suggestedMessage:
                'This deliverable is overdue and on the critical path for the decline restart. Please provide a revised completion date and any blockers by end of day.',
            },
          },
          {
            type: 'risk',
            priority: 'high',
            title: 'Dewatering panel delay could cascade into ventilation sign-off',
            description:
              'RAID item "Dewatering control panel delay may affect ventilation commissioning" is rated high severity with no recorded mitigation plan. ' +
              'INF-VENT-001 is currently in progress with a 17 May target. If dewatering slips, ventilation commissioning cannot be finalised, ' +
              'blocking section 54 clearance.',
            actionType: 'create_raid',
            actionPayload: {
              type: 'risk',
              title: 'Ventilation sign-off blocked pending dewatering panel delivery',
              description:
                'Dewatering control panel procurement is delayed. Ventilation commissioning (INF-VENT-001) cannot be finalised without it, ' +
                'which blocks section 54 clearance required before restart.',
              severity: 'critical',
            },
          },
          {
            type: 'risk',
            priority: 'medium',
            title: 'Mine operating procedure library not yet baselined',
            description:
              'GOV-CONTROL-002 "Mine operating procedure library baselined" is in progress and past its 7 May target date. ' +
              'Absence of a signed-off procedure library is a regulatory requirement and will be flagged at the DMR inspection. ' +
              'No owner is assigned to drive this to closure.',
            actionType: 'request_evidence',
            actionPayload: {
              deliverableId: D_PROCEDURES,
              deliverableName: 'Mine operating procedure library baselined',
              suggestedMessage:
                'Please upload the signed procedure library index or draft register as evidence of progress. This is required before the DMR inspection.',
            },
          },
          // ── Actions ───────────────────────────────────────────────────────
          {
            type: 'action',
            priority: 'high',
            title: 'Request evidence for underground power reticulation commissioning',
            description:
              'INF-POWER-001 "Underground power reticulation commissioned" is in progress with a 9 May deadline — less than two weeks away. ' +
              'No evidence has been uploaded to confirm commissioning test results. Request the commissioning certificate now to avoid a last-minute scramble.',
            actionType: 'request_evidence',
            actionPayload: {
              deliverableId: D_POWER,
              deliverableName: 'Underground power reticulation commissioned',
              suggestedMessage:
                'Please upload the commissioning test certificate or inspection report for the underground power reticulation as evidence of completion.',
            },
          },
          {
            type: 'action',
            priority: 'medium',
            title: 'Assign an owner to Grade Control and Ore Tracking before ramp-up',
            description:
              'HND-RAMP-002 "Grade control and ore tracking process ready" is planned with a 26 June target but has no assigned owner. ' +
              'Ramp-up deliverables without owners frequently slip. Assign a responsible person now to ensure accountability.',
            actionType: 'send_reminder',
            actionPayload: {
              deliverableId: D_GRADE_CONTROL,
              deliverableName: 'Grade control and ore tracking process ready',
              suggestedMessage:
                'This deliverable currently has no assigned owner. Please confirm who is responsible and update accordingly — target date is 26 June.',
            },
          },
          {
            type: 'action',
            priority: 'medium',
            title: 'Escalate gas monitoring alarm gap identified in RAID',
            description:
              'RAID issue "Gas monitoring alarm simulation found one escalation gap" is open at medium severity. ' +
              'This finding should be escalated to the Safety Manager and a corrective action scheduled before commissioning is declared complete.',
            actionType: 'create_raid',
            actionPayload: {
              type: 'issue',
              title: 'Gas monitoring escalation gap — corrective action required before restart',
              description:
                'Alarm simulation identified a gap in the gas monitoring escalation procedure. Corrective action must be implemented and re-tested before restart authorisation.',
              severity: 'high',
            },
          },
          // ── Insights ──────────────────────────────────────────────────────
          {
            type: 'insight',
            priority: 'medium',
            title: '3 of 5 infrastructure deliverables are in progress simultaneously',
            description:
              'Ventilation, power reticulation, and CMMS maintenance strategies are all being worked in parallel. ' +
              'While CMMS is closed, the remaining two share a 9–17 May delivery window. ' +
              'Consider a dedicated infrastructure stand-up twice weekly to keep pace and surface blockers early.',
            actionType: null,
            actionPayload: Prisma.JsonNull,
          },
          {
            type: 'insight',
            priority: 'low',
            title: 'Fleet telemetry dependency on wireless coverage should be tracked',
            description:
              'The RAID dependency "Fleet telemetry depends on underground wireless coverage completion" is listed at medium severity. ' +
              'Underground wireless is not visible as a standalone deliverable in the current plan. ' +
              'Consider adding it explicitly so progress is trackable and the dependency can be resolved.',
            actionType: null,
            actionPayload: Prisma.JsonNull,
          },
        ],
      },
    },
  })

  console.log('✓ Sample AI suggestion seeded for "Mokopane Decline Restart Readiness"')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
