import { PrismaClient, type Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

type SeedDeliverable = {
  code: string
  name: string
  description: string
  phase: 'pre_commissioning' | 'commissioning' | 'ramp_up' | 'handover'
  domain: string
  estimatedDuration: number
  checklist: string[]
  evidence: Array<{ name: string; type: string; description: string; required?: boolean }>
}

type SeedSubSection = {
  code: string
  name: string
  deliverables: SeedDeliverable[]
}

type SeedFocusArea = {
  code: string
  name: string
  subSections: SeedSubSection[]
}

type SeedTemplate = {
  name: string
  description: string
  industry: string
  version: string
  focusAreas: SeedFocusArea[]
}

const undergroundTemplate: SeedTemplate = {
  name: 'Underground Mine Operational Readiness',
  description:
    'Comprehensive readiness template for underground mining projects covering statutory approvals, mine services, mobile equipment, people, emergency response, and handover evidence.',
  industry: 'Mining',
  version: '1.0',
  focusAreas: [
    {
      code: 'GOV',
      name: 'Governance and Permitting',
      subSections: [
        {
          code: 'GOV-REG',
          name: 'Regulatory approvals',
          deliverables: [
            {
              code: 'GOV-REG-001',
              name: 'Mining right and licence conditions readiness matrix',
              description:
                'Create a matrix of all licence, environmental, water use, explosives, and municipal conditions that must be satisfied before first production.',
              phase: 'pre_commissioning',
              domain: 'Compliance',
              estimatedDuration: 10,
              checklist: [
                'All operating licence conditions are captured with accountable owners.',
                'Conditions required before first production are marked as mandatory gates.',
                'Outstanding regulator submissions have due dates and escalation owners.',
                'Matrix has been reviewed by legal, environmental, safety, and operations leads.',
              ],
              evidence: [
                {
                  name: 'Approved licence readiness matrix',
                  type: 'document',
                  description: 'Controlled spreadsheet or register showing every pre-production condition, status, owner, due date, and evidence reference.',
                },
                {
                  name: 'Regulator correspondence pack',
                  type: 'document',
                  description: 'Copies of approvals, submissions, acknowledgements, exemptions, and open correspondence.',
                },
                {
                  name: 'Executive gate sign-off',
                  type: 'sign_off',
                  description: 'Signed readiness gate confirmation from the project sponsor and accountable compliance lead.',
                },
              ],
            },
            {
              code: 'GOV-REG-002',
              name: 'Principal hazard management plans approved',
              description:
                'Confirm principal hazard management plans are complete, site-specific, and approved for underground operations.',
              phase: 'pre_commissioning',
              domain: 'Safety',
              estimatedDuration: 15,
              checklist: [
                'Plans cover ground control, ventilation, fires, explosions, inundation, traffic, explosives, and emergency response.',
                'Risk assessments are current and include operational controls for commissioning and ramp-up.',
                'Plan owners have approved implementation requirements and verification frequencies.',
                'Workforce briefings and acknowledgement records are scheduled before underground access.',
              ],
              evidence: [
                {
                  name: 'Approved principal hazard management plans',
                  type: 'document',
                  description: 'Approved controlled documents with revision numbers and approval records.',
                },
                {
                  name: 'Hazard workshop attendance record',
                  type: 'document',
                  description: 'Attendance sheet, agenda, minutes, and action register from final hazard review workshop.',
                },
                {
                  name: 'Workforce briefing pack',
                  type: 'document',
                  description: 'Toolbox material, induction module, or briefing slides used to communicate critical controls.',
                },
              ],
            },
          ],
        },
        {
          code: 'GOV-CONTROL',
          name: 'Operating controls',
          deliverables: [
            {
              code: 'GOV-CONTROL-001',
              name: 'Operational readiness gate review completed',
              description:
                'Run the formal readiness gate review and capture action closure evidence before authorising commissioning work.',
              phase: 'pre_commissioning',
              domain: 'Project Controls',
              estimatedDuration: 5,
              checklist: [
                'Gate criteria include people, plant, process, permits, procedures, spares, systems, and emergency readiness.',
                'Open actions have owners, due dates, and accepted risk ratings.',
                'Critical blockers are escalated and resolved or formally accepted.',
                'Gate outcome is recorded with sponsor approval.',
              ],
              evidence: [
                {
                  name: 'Readiness gate checklist',
                  type: 'document',
                  description: 'Completed gate checklist with all criteria marked pass, conditional pass, or fail.',
                },
                {
                  name: 'Gate review minutes and action log',
                  type: 'document',
                  description: 'Minutes showing decisions, action owners, deadlines, and closure status.',
                },
                {
                  name: 'Sponsor gate approval',
                  type: 'sign_off',
                  description: 'Formal authorisation to proceed to commissioning or ramp-up.',
                },
              ],
            },
            {
              code: 'GOV-CONTROL-002',
              name: 'Mine operating procedure library baselined',
              description:
                'Publish controlled operating procedures for core mining, services, maintenance, emergency, and reporting processes.',
              phase: 'pre_commissioning',
              domain: 'Operations',
              estimatedDuration: 20,
              checklist: [
                'Procedure index maps every procedure to an owner and approving role.',
                'Critical procedures have been field-verified by supervisors and operators.',
                'Document control metadata is complete and searchable.',
                'Expired, draft, and superseded procedures have been removed from operational use.',
              ],
              evidence: [
                {
                  name: 'Controlled procedure index',
                  type: 'document',
                  description: 'Document register with document numbers, owners, revision dates, and approval status.',
                },
                {
                  name: 'Field verification records',
                  type: 'document',
                  description: 'Signed checks confirming procedures are practical in the intended work area.',
                },
                {
                  name: 'Published document library link',
                  type: 'link',
                  description: 'Link to the document management system folder available to operations.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      code: 'INF',
      name: 'Infrastructure and Mine Services',
      subSections: [
        {
          code: 'INF-POWER',
          name: 'Power and utilities',
          deliverables: [
            {
              code: 'INF-POWER-001',
              name: 'Underground power reticulation commissioned',
              description:
                'Commission underground power distribution, protection settings, earthing, lock-out points, and inspection regime.',
              phase: 'commissioning',
              domain: 'Electrical',
              estimatedDuration: 12,
              checklist: [
                'Distribution boards, substations, cables, and transformers are labelled and included in the asset register.',
                'Protection settings are tested and matched to the approved design.',
                'Isolation and lock-out points are verified in the field.',
                'Initial inspection and statutory test records are complete.',
              ],
              evidence: [
                {
                  name: 'Electrical commissioning dossier',
                  type: 'document',
                  description: 'Test sheets, protection settings, inspection certificates, and punch list closure evidence.',
                },
                {
                  name: 'Single line diagram as-built',
                  type: 'document',
                  description: 'Approved as-built single line diagram showing final underground reticulation.',
                },
                {
                  name: 'Field labelling photo set',
                  type: 'image',
                  description: 'Photos of substations, panels, lock-out points, and critical cable labels.',
                },
              ],
            },
            {
              code: 'INF-POWER-002',
              name: 'Dewatering system operational readiness',
              description:
                'Confirm sumps, pumps, pipelines, controls, alarms, and backup response plans are ready for wet commissioning and first ore.',
              phase: 'commissioning',
              domain: 'Mine Services',
              estimatedDuration: 9,
              checklist: [
                'Pump curves and installed duty match design water balance requirements.',
                'Level alarms and control logic have been tested from field to control room.',
                'Critical spares and standby pumps are available onsite.',
                'Dewatering emergency response steps are understood by operations and maintenance.',
              ],
              evidence: [
                {
                  name: 'Dewatering commissioning test pack',
                  type: 'document',
                  description: 'Pump test records, control loop checks, alarm tests, and signed punch list closure.',
                },
                {
                  name: 'Water balance acceptance note',
                  type: 'document',
                  description: 'Engineering confirmation that installed capacity meets expected inflow and storm event assumptions.',
                },
                {
                  name: 'Sump and pump inspection photos',
                  type: 'image',
                  description: 'Photos showing final pump installation, access, guards, and housekeeping.',
                },
              ],
            },
          ],
        },
        {
          code: 'INF-VENT',
          name: 'Ventilation and environmental controls',
          deliverables: [
            {
              code: 'INF-VENT-001',
              name: 'Primary ventilation system verified',
              description:
                'Verify primary fans, ventilation doors, regulators, stoppings, airflow quantities, and emergency operating modes.',
              phase: 'commissioning',
              domain: 'Ventilation',
              estimatedDuration: 14,
              checklist: [
                'Airflow readings meet the approved ventilation model at defined measuring stations.',
                'Fan trips, alarms, and emergency stop logic are tested.',
                'Ventilation control devices are installed and tagged.',
                'Variance to model is documented with engineering acceptance.',
              ],
              evidence: [
                {
                  name: 'Ventilation survey report',
                  type: 'document',
                  description: 'Measured airflow, gas, temperature, and pressure readings against modelled requirements.',
                },
                {
                  name: 'Fan commissioning certificate',
                  type: 'document',
                  description: 'Mechanical and electrical commissioning records for primary and booster fans.',
                },
                {
                  name: 'Ventilation model approval',
                  type: 'sign_off',
                  description: 'Engineering and statutory ventilation officer sign-off for operating conditions.',
                },
              ],
            },
            {
              code: 'INF-VENT-002',
              name: 'Gas monitoring network active',
              description:
                'Install, calibrate, and verify fixed gas monitors, alarms, communication links, and response escalation.',
              phase: 'commissioning',
              domain: 'Safety Systems',
              estimatedDuration: 8,
              checklist: [
                'All required fixed gas monitors are installed at approved locations.',
                'Calibration certificates are current and traceable.',
                'Alarm thresholds and notification paths match the emergency response plan.',
                'Control room operators have completed alarm response simulation.',
              ],
              evidence: [
                {
                  name: 'Gas monitor calibration certificates',
                  type: 'document',
                  description: 'Calibration records for fixed monitors and reference gas details.',
                },
                {
                  name: 'Alarm response simulation record',
                  type: 'document',
                  description: 'Scenario test record showing alarm receipt, escalation, and response timing.',
                },
                {
                  name: 'Monitoring dashboard link',
                  type: 'link',
                  description: 'Link to live monitoring dashboard or historian trend view.',
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      code: 'MOB',
      name: 'Mobile Equipment and Maintenance',
      subSections: [
        {
          code: 'MOB-FLEET',
          name: 'Production fleet',
          deliverables: [
            {
              code: 'MOB-FLEET-001',
              name: 'Load haul dump fleet pre-start acceptance',
              description:
                'Accept LHD units for underground duty including guarding, fire suppression, proximity detection, telemetry, and statutory inspections.',
              phase: 'commissioning',
              domain: 'Mobile Equipment',
              estimatedDuration: 11,
              checklist: [
                'Each LHD has passed mechanical, electrical, safety, and statutory pre-start acceptance.',
                'Fire suppression and proximity detection tests are recorded.',
                'Operator pre-use checklist is configured in the fleet system.',
                'Defects identified during acceptance have been closed or risk accepted.',
              ],
              evidence: [
                {
                  name: 'Fleet acceptance certificates',
                  type: 'document',
                  description: 'Signed acceptance pack for each LHD unit entering underground service.',
                },
                {
                  name: 'Fire suppression test records',
                  type: 'document',
                  description: 'Functional test reports for automatic and manual suppression systems.',
                },
                {
                  name: 'Accepted unit photo register',
                  type: 'image',
                  description: 'Photos showing unit IDs, safety decals, guards, extinguishers, and proximity tags.',
                },
              ],
            },
            {
              code: 'MOB-FLEET-002',
              name: 'Fleet management and dispatch configured',
              description:
                'Configure equipment masters, operator logins, assignment rules, shift reports, KPIs, and escalation workflows.',
              phase: 'ramp_up',
              domain: 'Systems',
              estimatedDuration: 7,
              checklist: [
                'Equipment masters and operator profiles are loaded and validated.',
                'Shift assignment and production reporting workflow has been tested.',
                'Supervisors can access dashboards and exception reports.',
                'Fallback manual dispatch process is documented and briefed.',
              ],
              evidence: [
                {
                  name: 'Fleet system configuration export',
                  type: 'document',
                  description: 'Configuration evidence showing equipment, users, assignments, and production codes.',
                },
                {
                  name: 'Dispatch dry-run record',
                  type: 'document',
                  description: 'Dry-run results for shift setup, assignment changes, production capture, and supervisor review.',
                },
                {
                  name: 'Dashboard access screenshot',
                  type: 'image',
                  description: 'Screenshot of live dispatch or fleet KPI dashboard with seed or commissioning data.',
                },
              ],
            },
          ],
        },
        {
          code: 'MOB-MAINT',
          name: 'Maintenance readiness',
          deliverables: [
            {
              code: 'MOB-MAINT-001',
              name: 'Maintenance strategies loaded into CMMS',
              description:
                'Load planned maintenance strategies, task lists, frequencies, labour estimates, and criticality ratings into the CMMS.',
              phase: 'pre_commissioning',
              domain: 'Maintenance',
              estimatedDuration: 16,
              checklist: [
                'Asset hierarchy aligns to engineering handover and tag register.',
                'Preventive maintenance task lists include labour, tools, spares, and safety controls.',
                'Criticality ratings are reviewed by maintenance and operations.',
                'First 90-day work orders have been generated and checked.',
              ],
              evidence: [
                {
                  name: 'CMMS asset hierarchy extract',
                  type: 'document',
                  description: 'System export showing assets, parent-child structure, criticality, and status.',
                },
                {
                  name: 'Maintenance strategy approval',
                  type: 'sign_off',
                  description: 'Maintenance manager approval of PM strategies and first maintenance window plan.',
                },
                {
                  name: 'First 90-day work order plan',
                  type: 'document',
                  description: 'Generated work orders or schedule for initial operating period.',
                },
              ],
            },
            {
              code: 'MOB-MAINT-002',
              name: 'Critical spares and consumables staged',
              description:
                'Confirm critical spares, tyres, hoses, filters, ground support consumables, lubricants, and vendor consignment stock are staged.',
              phase: 'pre_commissioning',
              domain: 'Supply Chain',
              estimatedDuration: 10,
              checklist: [
                'Critical spares list is approved by maintenance, supply chain, and operations.',
                'Minimum and maximum stock levels are loaded in the inventory system.',
                'Commissioning and ramp-up consumables are physically staged.',
                'Long-lead and consignment stock agreements are active.',
              ],
              evidence: [
                {
                  name: 'Critical spares readiness report',
                  type: 'document',
                  description: 'Stock availability report against approved critical spares list.',
                },
                {
                  name: 'Warehouse staging photos',
                  type: 'image',
                  description: 'Photos of staged critical spares, labelled bins, and segregated commissioning stock.',
                },
                {
                  name: 'Vendor support agreement',
                  type: 'document',
                  description: 'Signed support or consignment agreement for critical equipment suppliers.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      code: 'PEO',
      name: 'People, Training and Organisation',
      subSections: [
        {
          code: 'PEO-ORG',
          name: 'Operating model',
          deliverables: [
            {
              code: 'PEO-ORG-001',
              name: 'Mine operating roster and crew structure approved',
              description:
                'Approve the production roster, supervisory structure, statutory appointments, relief coverage, and escalation paths.',
              phase: 'pre_commissioning',
              domain: 'Organisation',
              estimatedDuration: 8,
              checklist: [
                'Roster covers production, maintenance, technical services, control room, emergency response, and management coverage.',
                'Critical statutory appointments have named incumbents and alternates.',
                'Escalation paths are published for normal, abnormal, and emergency operations.',
                'Labour plan has been reconciled with ramp-up production assumptions.',
              ],
              evidence: [
                {
                  name: 'Approved operating organisation chart',
                  type: 'document',
                  description: 'Organisation chart with names, vacancies, alternates, and statutory appointment mapping.',
                },
                {
                  name: 'Roster coverage analysis',
                  type: 'document',
                  description: 'Roster model showing coverage, relief, fatigue checks, and shift handover windows.',
                },
                {
                  name: 'Statutory appointment letters',
                  type: 'document',
                  description: 'Signed appointment letters or acting appointment records.',
                },
              ],
            },
            {
              code: 'PEO-ORG-002',
              name: 'Control room roles and escalation process ready',
              description:
                'Confirm the control room operating model, shift handover, alarm response roles, communications protocol, and daily reporting cadence.',
              phase: 'commissioning',
              domain: 'Control Room',
              estimatedDuration: 6,
              checklist: [
                'Control room operator role descriptions and shift routines are approved.',
                'Alarm priority matrix and escalation rules are published.',
                'Daily production and safety reporting templates are ready.',
                'Shift handover process has been simulated and accepted.',
              ],
              evidence: [
                {
                  name: 'Control room operating procedure',
                  type: 'document',
                  description: 'Approved procedure covering monitoring, escalation, reporting, and handover.',
                },
                {
                  name: 'Shift handover simulation record',
                  type: 'document',
                  description: 'Evidence of a completed handover dry-run and issues captured.',
                },
                {
                  name: 'Control room readiness photos',
                  type: 'image',
                  description: 'Photos showing final desk setup, displays, radios, emergency contacts, and logbooks.',
                },
              ],
            },
          ],
        },
        {
          code: 'PEO-TRAIN',
          name: 'Competency and training',
          deliverables: [
            {
              code: 'PEO-TRAIN-001',
              name: 'Role-based competency matrix complete',
              description:
                'Build and approve role-based competency requirements for operators, maintainers, supervisors, contractors, and emergency responders.',
              phase: 'pre_commissioning',
              domain: 'Training',
              estimatedDuration: 12,
              checklist: [
                'Every critical role has mandatory training, licences, medicals, and site authorisations mapped.',
                'High-risk task competencies are linked to procedures and permit requirements.',
                'Competency gaps have training dates and restrictions until closed.',
                'Supervisors can access the matrix during shift allocation.',
              ],
              evidence: [
                {
                  name: 'Approved competency matrix',
                  type: 'document',
                  description: 'Controlled matrix mapping roles to training, licences, authorisations, and restrictions.',
                },
                {
                  name: 'Training gap action plan',
                  type: 'document',
                  description: 'Open competency gaps, owners, dates, and interim controls.',
                },
                {
                  name: 'Learning system link',
                  type: 'link',
                  description: 'Link to LMS report or competency dashboard.',
                  required: false,
                },
              ],
            },
            {
              code: 'PEO-TRAIN-002',
              name: 'Emergency response drills completed',
              description:
                'Complete commissioning emergency drills for evacuation, refuge chamber use, fire, medical response, and loss of ventilation.',
              phase: 'commissioning',
              domain: 'Emergency Response',
              estimatedDuration: 9,
              checklist: [
                'Drill scenarios cover likely underground emergencies and abnormal operating conditions.',
                'Response times, communications, muster, and command roles are measured.',
                'Actions from drills are captured, assigned, and closed or risk accepted.',
                'Emergency services interfaces and call-out contacts have been verified.',
              ],
              evidence: [
                {
                  name: 'Emergency drill reports',
                  type: 'document',
                  description: 'Scenario plans, attendance, timings, lessons learned, and action closure status.',
                },
                {
                  name: 'Muster and refuge chamber inspection records',
                  type: 'document',
                  description: 'Inspection evidence for muster points, refuge chambers, first aid, and emergency supplies.',
                },
                {
                  name: 'Drill debrief sign-off',
                  type: 'sign_off',
                  description: 'Signed approval that emergency response capability is acceptable for operation.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      code: 'HND',
      name: 'Ramp-up and Handover',
      subSections: [
        {
          code: 'HND-RAMP',
          name: 'Ramp-up controls',
          deliverables: [
            {
              code: 'HND-RAMP-001',
              name: 'First 90-day ramp-up plan approved',
              description:
                'Approve the ramp-up plan, production assumptions, equipment availability targets, grade control interfaces, and daily review cadence.',
              phase: 'ramp_up',
              domain: 'Operations Planning',
              estimatedDuration: 8,
              checklist: [
                'Ramp-up tonnage, development metres, grade, and availability assumptions are documented.',
                'Daily and weekly performance review cadence is agreed.',
                'Constraints, decision triggers, and escalation thresholds are defined.',
                'Plan is aligned with maintenance windows, ventilation limits, and workforce availability.',
              ],
              evidence: [
                {
                  name: 'Approved ramp-up plan',
                  type: 'document',
                  description: 'First 90-day production, development, maintenance, and review plan.',
                },
                {
                  name: 'Ramp-up KPI dashboard',
                  type: 'link',
                  description: 'Link to live or pilot dashboard for production and readiness KPIs.',
                },
                {
                  name: 'Operations review cadence sign-off',
                  type: 'sign_off',
                  description: 'Approval from operations, maintenance, technical services, and project controls.',
                },
              ],
            },
            {
              code: 'HND-RAMP-002',
              name: 'Grade control and ore tracking process ready',
              description:
                'Confirm grade control sampling, mark-up, stockpile management, reconciliation, and ore tracking workflows.',
              phase: 'ramp_up',
              domain: 'Technical Services',
              estimatedDuration: 7,
              checklist: [
                'Grade control responsibilities and shift interfaces are defined.',
                'Sampling, assay, mark-up, and ore release workflows have been tested.',
                'Ore tracking is reconciled from face to stockpile or plant feed point.',
                'Daily reconciliation report is ready for production meetings.',
              ],
              evidence: [
                {
                  name: 'Grade control procedure',
                  type: 'document',
                  description: 'Approved procedure for sampling, mark-up, ore release, and reconciliation.',
                },
                {
                  name: 'Ore tracking dry-run report',
                  type: 'document',
                  description: 'Dry-run record showing tracked tonnes and grade through the process.',
                },
                {
                  name: 'Sample chain-of-custody form',
                  type: 'document',
                  description: 'Example completed chain-of-custody and assay request form.',
                },
              ],
            },
          ],
        },
        {
          code: 'HND-OPS',
          name: 'Operational handover',
          deliverables: [
            {
              code: 'HND-OPS-001',
              name: 'Engineering handover dossiers accepted',
              description:
                'Accept engineering handover dossiers including as-builts, certificates, manuals, spares, warranties, and outstanding defects.',
              phase: 'handover',
              domain: 'Engineering',
              estimatedDuration: 15,
              checklist: [
                'All handover dossier sections are complete or have accepted waivers.',
                'Outstanding defects are risk-rated and assigned to operations or project closure.',
                'As-built drawings and manuals are uploaded to controlled document repositories.',
                'Operations and maintenance representatives have signed acceptance.',
              ],
              evidence: [
                {
                  name: 'Handover dossier index',
                  type: 'document',
                  description: 'Index of dossiers, documents, certificates, manuals, and outstanding items.',
                },
                {
                  name: 'Punch list closure report',
                  type: 'document',
                  description: 'Closed and transferred punch items with owner and due date.',
                },
                {
                  name: 'Operations acceptance sign-off',
                  type: 'sign_off',
                  description: 'Formal handover acceptance by operations and maintenance leaders.',
                },
              ],
            },
            {
              code: 'HND-OPS-002',
              name: 'Benefits and readiness closure review completed',
              description:
                'Complete post-handover review of readiness outcomes, benefit assumptions, residual risks, and improvement actions.',
              phase: 'handover',
              domain: 'Business Readiness',
              estimatedDuration: 5,
              checklist: [
                'Readiness outcomes are compared against gate criteria and ramp-up assumptions.',
                'Residual risks and obligations are transferred to named operational owners.',
                'Lessons learned are captured for future projects.',
                'Final closure report is approved by sponsor and operations.',
              ],
              evidence: [
                {
                  name: 'Readiness closure report',
                  type: 'document',
                  description: 'Final closure report covering benefits, readiness results, risks, actions, and lessons learned.',
                },
                {
                  name: 'Residual risk transfer register',
                  type: 'document',
                  description: 'Signed transfer register for residual risks, actions, and operational obligations.',
                },
                {
                  name: 'Sponsor closure approval',
                  type: 'sign_off',
                  description: 'Formal project readiness closure approval.',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

const processingPlantTemplate: SeedTemplate = {
  name: 'Mineral Processing Plant Commissioning Readiness',
  description:
    'Readiness template for crushing, milling, flotation, tailings, reagents, laboratory, control systems, and operational handover.',
  industry: 'Mining',
  version: '1.0',
  focusAreas: [
    {
      code: 'PROC',
      name: 'Process Plant Systems',
      subSections: [
        {
          code: 'PROC-COMM',
          name: 'Mechanical and process commissioning',
          deliverables: [
            {
              code: 'PROC-COMM-001',
              name: 'Crushing and screening circuit commissioned',
              description: 'Commission feeders, crushers, screens, conveyors, magnets, dust systems, guards, and interlocks.',
              phase: 'commissioning',
              domain: 'Process Plant',
              estimatedDuration: 12,
              checklist: [
                'No-load and ore-load commissioning tests are complete.',
                'Critical guards, pull wires, interlocks, and emergency stops are tested.',
                'Dust extraction and housekeeping controls are operational.',
                'Punch list items are closed or transferred with risk acceptance.',
              ],
              evidence: [
                { name: 'Crusher commissioning test pack', type: 'document', description: 'Signed mechanical, electrical, interlock, and load test records.' },
                { name: 'Guarding and pull-wire photo evidence', type: 'image', description: 'Photos showing final guarding and pull-wire coverage.' },
                { name: 'Circuit acceptance sign-off', type: 'sign_off', description: 'Operations and engineering acceptance for ore introduction.' },
              ],
            },
            {
              code: 'PROC-COMM-002',
              name: 'Milling and classification circuit ready',
              description: 'Confirm mills, cyclones, pumps, lubrication, water addition, instrumentation, and operating limits.',
              phase: 'commissioning',
              domain: 'Process Plant',
              estimatedDuration: 14,
              checklist: [
                'Lubrication, cooling, bearing, and vibration protection systems are tested.',
                'Control loops and instrumentation are calibrated.',
                'Operating envelope and trip limits are approved.',
                'Operators have completed normal and abnormal operating simulations.',
              ],
              evidence: [
                { name: 'Mill commissioning dossier', type: 'document', description: 'Mechanical completion, control loop, and performance test records.' },
                { name: 'Operating envelope approval', type: 'document', description: 'Approved ramp-up envelope and control limits.' },
                { name: 'Operator simulation record', type: 'document', description: 'Training and simulator attendance records.' },
              ],
            },
          ],
        },
        {
          code: 'PROC-TAIL',
          name: 'Tailings and water management',
          deliverables: [
            {
              code: 'PROC-TAIL-001',
              name: 'Tailings deposition readiness confirmed',
              description: 'Confirm deposition plan, pumps, pipelines, spigots, monitoring, freeboard, inspections, and emergency response.',
              phase: 'commissioning',
              domain: 'Tailings',
              estimatedDuration: 10,
              checklist: [
                'Deposition plan is approved by tailings engineer of record.',
                'Pipelines, valves, spigots, and containment inspections are complete.',
                'Freeboard, piezometer, and monitoring requirements are active.',
                'Tailings emergency response procedure is briefed.',
              ],
              evidence: [
                { name: 'Tailings deposition plan approval', type: 'sign_off', description: 'Engineer of record approval and operating constraints.' },
                { name: 'Pipeline and spigot inspection records', type: 'document', description: 'Field inspection records and pressure test evidence.' },
                { name: 'Monitoring dashboard link', type: 'link', description: 'Link to water balance or tailings monitoring dashboard.', required: false },
              ],
            },
            {
              code: 'PROC-TAIL-002',
              name: 'Process water balance accepted',
              description: 'Verify water sources, reclaim systems, make-up water, discharge limits, and seasonal water balance assumptions.',
              phase: 'pre_commissioning',
              domain: 'Water Management',
              estimatedDuration: 8,
              checklist: [
                'Water balance model has been updated with as-built capacities.',
                'Discharge and abstraction permit conditions are mapped to operating controls.',
                'Critical water quality monitoring points are active.',
                'Contingency plan exists for water surplus and deficit scenarios.',
              ],
              evidence: [
                { name: 'Approved process water balance', type: 'document', description: 'Signed water balance report with commissioning assumptions.' },
                { name: 'Permit condition operating matrix', type: 'document', description: 'Water permit controls linked to operating checks.' },
                { name: 'Water monitoring location photos', type: 'image', description: 'Photos of meters, sampling points, and monitoring stations.' },
              ],
            },
          ],
        },
      ],
    },
    {
      code: 'LAB',
      name: 'Metallurgy and Laboratory',
      subSections: [
        {
          code: 'LAB-QA',
          name: 'Quality assurance',
          deliverables: [
            {
              code: 'LAB-QA-001',
              name: 'Sampling and assay QA/QC process ready',
              description: 'Confirm sampling points, sample preparation, assay turnaround, standards, blanks, duplicates, and reporting workflow.',
              phase: 'pre_commissioning',
              domain: 'Metallurgy',
              estimatedDuration: 9,
              checklist: [
                'Sampling points are installed, labelled, and accessible.',
                'QA/QC standards, blanks, and duplicate frequency are defined.',
                'Assay data flow to metallurgical accounting has been tested.',
                'Non-conforming sample process is documented.',
              ],
              evidence: [
                { name: 'Sampling QA/QC procedure', type: 'document', description: 'Approved sampling and assay quality procedure.' },
                { name: 'Sample point photo register', type: 'image', description: 'Photos of installed and labelled sample points.' },
                { name: 'Assay data flow dry-run', type: 'document', description: 'Dry-run showing sample receipt through reporting.' },
              ],
            },
            {
              code: 'LAB-QA-002',
              name: 'Metallurgical accounting model approved',
              description: 'Approve mass balance, recovery assumptions, stockpile accounting, and production reporting model.',
              phase: 'ramp_up',
              domain: 'Metallurgy',
              estimatedDuration: 7,
              checklist: [
                'Mass balance model has reviewed inputs and reconciliation logic.',
                'Recovery and grade assumptions are aligned to ramp-up plan.',
                'Daily, weekly, and monthly reporting outputs are tested.',
                'Operations, finance, and technical services approve the model.',
              ],
              evidence: [
                { name: 'Metallurgical accounting model', type: 'document', description: 'Controlled model and approval record.' },
                { name: 'Production report dry-run', type: 'document', description: 'Dry-run production report with sample data and variance checks.' },
                { name: 'Model approval sign-off', type: 'sign_off', description: 'Approval by metallurgy, operations, and finance representatives.' },
              ],
            },
          ],
        },
      ],
    },
    {
      code: 'REAG',
      name: 'Reagents and Consumables',
      subSections: [
        {
          code: 'REAG-STOR',
          name: 'Storage and supply',
          deliverables: [
            {
              code: 'REAG-STOR-001',
              name: 'Reagent storage and dosing readiness',
              description: 'Confirm reagent storage, bunding, SDS, dosing pumps, calibration, PPE, emergency showers, and unloading process.',
              phase: 'commissioning',
              domain: 'Reagents',
              estimatedDuration: 8,
              checklist: [
                'Reagent stores meet compatibility, bunding, signage, and access requirements.',
                'Dosing pumps and flow meters are calibrated.',
                'SDS, PPE, and emergency shower checks are complete.',
                'Unloading and spill response procedures are briefed.',
              ],
              evidence: [
                { name: 'Reagent area inspection checklist', type: 'document', description: 'Inspection record for storage, bunding, PPE, and emergency equipment.' },
                { name: 'Dosing calibration certificates', type: 'document', description: 'Calibration records for dosing pumps and flow meters.' },
                { name: 'SDS library link', type: 'link', description: 'Link to controlled SDS library.' },
              ],
            },
            {
              code: 'REAG-STOR-002',
              name: 'Consumables supply plan approved',
              description: 'Approve supplier commitments, reorder parameters, warehouse staging, and commissioning consumable drawdown plan.',
              phase: 'pre_commissioning',
              domain: 'Supply Chain',
              estimatedDuration: 6,
              checklist: [
                'Critical consumables have approved suppliers and delivery schedules.',
                'Inventory min/max settings are loaded.',
                'Commissioning stock is staged and labelled.',
                'Supply risks have mitigation plans and alternates.',
              ],
              evidence: [
                { name: 'Consumables readiness report', type: 'document', description: 'Stock report against planned commissioning and first production requirements.' },
                { name: 'Supplier commitment letters', type: 'document', description: 'Supplier confirmations for critical consumables.' },
                { name: 'Warehouse staging photos', type: 'image', description: 'Photos of staged reagent and consumable inventory.' },
              ],
            },
          ],
        },
      ],
    },
  ],
}

function daysFromNow(days: number) {
  const date = new Date()
  date.setHours(9, 0, 0, 0)
  date.setDate(date.getDate() + days)
  return date
}

function publicEvidenceUrl(fileName: string) {
  return `/files/seed-evidence/${fileName}`
}

async function ensureAuditEvent(data: {
  organizationId: string
  templateId?: string | null
  projectId?: string | null
  deliverableExecutionId?: string | null
  actorName: string
  eventType: string
  description: string
  metadata?: Prisma.InputJsonValue
  createdAt?: Date
}) {
  const existing = await prisma.auditEvent.findFirst({
    where: {
      organizationId: data.organizationId,
      templateId: data.templateId ?? null,
      projectId: data.projectId ?? null,
      deliverableExecutionId: data.deliverableExecutionId ?? null,
      eventType: data.eventType,
      description: data.description,
    },
  })

  if (existing) return existing

  return prisma.auditEvent.create({
    data: {
      organizationId: data.organizationId,
      templateId: data.templateId ?? null,
      projectId: data.projectId ?? null,
      deliverableExecutionId: data.deliverableExecutionId ?? null,
      actorName: data.actorName,
      eventType: data.eventType,
      description: data.description,
      metadata: data.metadata,
      createdAt: data.createdAt,
    },
  })
}

async function ensureTemplate(orgId: string, templateData: SeedTemplate) {
  let template = await prisma.template.findFirst({
    where: { organizationId: orgId, name: templateData.name },
    include: { _count: { select: { focusAreas: true } } },
  })

  if (!template) {
    template = await prisma.template.create({
      data: {
        organizationId: orgId,
        name: templateData.name,
        description: templateData.description,
        industry: templateData.industry,
        version: templateData.version,
      },
      include: { _count: { select: { focusAreas: true } } },
    })
    console.log(`Created template: ${templateData.name}`)
  } else {
    await prisma.template.update({
      where: { id: template.id },
      data: {
        description: templateData.description,
        industry: templateData.industry,
        version: templateData.version,
        isArchived: false,
      },
    })
  }

  if (template._count.focusAreas > 0) return template

  const templateDeliverables = new Map<string, string>()

  for (let focusIndex = 0; focusIndex < templateData.focusAreas.length; focusIndex += 1) {
    const focusArea = templateData.focusAreas[focusIndex]
    const createdFocusArea = await prisma.focusArea.create({
      data: {
        templateId: template.id,
        code: focusArea.code,
        name: focusArea.name,
        order: focusIndex,
      },
    })

    for (let subIndex = 0; subIndex < focusArea.subSections.length; subIndex += 1) {
      const subSection = focusArea.subSections[subIndex]
      const createdSubSection = await prisma.subSection.create({
        data: {
          focusAreaId: createdFocusArea.id,
          code: subSection.code,
          name: subSection.name,
          order: subIndex,
        },
      })

      for (const deliverable of subSection.deliverables) {
        const createdDeliverable = await prisma.deliverableTemplate.create({
          data: {
            subSectionId: createdSubSection.id,
            code: deliverable.code,
            name: deliverable.name,
            description: deliverable.description,
            phase: deliverable.phase,
            domain: deliverable.domain,
            estimatedDuration: deliverable.estimatedDuration,
            acceptanceCriteria: {
              create: deliverable.checklist.map((description: string) => ({
                description,
                verificationMethod: 'Readiness checklist review and accountable owner confirmation',
              })),
            },
            evidenceRequirements: {
              create: deliverable.evidence.map((item: SeedDeliverable['evidence'][number]) => ({
                name: item.name,
                type: item.type,
                description: item.description,
                required: item.required ?? true,
              })),
            },
          },
        })
        templateDeliverables.set(deliverable.code, createdDeliverable.id)
      }
    }
  }

  const dependencyPairs = [
    ['GOV-REG-001', 'GOV-CONTROL-001'],
    ['GOV-REG-002', 'PEO-TRAIN-002'],
    ['INF-POWER-001', 'INF-VENT-001'],
    ['INF-VENT-001', 'HND-RAMP-001'],
    ['MOB-MAINT-001', 'MOB-FLEET-001'],
    ['MOB-MAINT-002', 'HND-RAMP-001'],
    ['PEO-TRAIN-001', 'PEO-TRAIN-002'],
    ['HND-RAMP-001', 'HND-OPS-001'],
    ['HND-OPS-001', 'HND-OPS-002'],
    ['PROC-COMM-001', 'PROC-COMM-002'],
    ['PROC-TAIL-002', 'PROC-TAIL-001'],
    ['LAB-QA-001', 'LAB-QA-002'],
    ['REAG-STOR-002', 'REAG-STOR-001'],
  ] as const

  for (const [sourceCode, targetCode] of dependencyPairs) {
    const sourceId = templateDeliverables.get(sourceCode)
    const targetId = templateDeliverables.get(targetCode)
    if (sourceId && targetId) {
      await prisma.deliverableTemplateDependency.upsert({
        where: { sourceId_targetId: { sourceId, targetId } },
        update: {},
        create: { sourceId, targetId },
      })
    }
  }

  return template
}

async function ensureProjectFromTemplate(
  orgId: string,
  templateId: string,
  data: {
    name: string
    description: string
    status?: 'active' | 'blocked' | 'completed' | 'archived'
    startDate: Date
    targetDate: Date
  },
) {
  let project = await prisma.project.findFirst({
    where: { organizationId: orgId, name: data.name },
    include: { _count: { select: { focusAreaExecutions: true } } },
  })

  if (!project) {
    project = await prisma.project.create({
      data: {
        organizationId: orgId,
        templateId,
        name: data.name,
        description: data.description,
        status: data.status ?? 'active',
        startDate: data.startDate,
        targetDate: data.targetDate,
      },
      include: { _count: { select: { focusAreaExecutions: true } } },
    })
    console.log(`Created project: ${data.name}`)
  } else {
    await prisma.project.update({
      where: { id: project.id },
      data: {
        templateId,
        description: data.description,
        status: data.status ?? project.status,
        startDate: data.startDate,
        targetDate: data.targetDate,
      },
    })
  }

  if (project._count.focusAreaExecutions > 0) return project

  const template = await prisma.template.findUniqueOrThrow({
    where: { id: templateId },
    include: {
      focusAreas: {
        orderBy: { order: 'asc' },
        include: {
          subSections: {
            orderBy: { order: 'asc' },
            include: { deliverables: { orderBy: { code: 'asc' } } },
          },
        },
      },
    },
  })

  for (const focusArea of template.focusAreas) {
    const focusAreaExecution = await prisma.focusAreaExecution.create({
      data: {
        projectId: project.id,
        code: focusArea.code,
        name: focusArea.name,
        order: focusArea.order,
      },
    })

    for (const subSection of focusArea.subSections) {
      const subSectionExecution = await prisma.subSectionExecution.create({
        data: {
          focusAreaExecutionId: focusAreaExecution.id,
          code: subSection.code,
          name: subSection.name,
          order: subSection.order,
        },
      })

      for (const deliverable of subSection.deliverables) {
        await prisma.deliverableExecution.create({
          data: {
            organizationId: orgId,
            subSectionExecutionId: subSectionExecution.id,
            templateDeliverableId: deliverable.id,
            name: deliverable.name,
            code: deliverable.code,
            description: deliverable.description,
            phase: deliverable.phase,
            domain: deliverable.domain,
            status: 'planned',
          },
        })
      }
    }
  }

  return project
}

async function getProjectDeliverables(projectId: string, orgId: string) {
  const deliverables = await prisma.deliverableExecution.findMany({
    where: {
      organizationId: orgId,
      subSectionExecution: { focusAreaExecution: { projectId } },
    },
    include: {
      subSectionExecution: { include: { focusAreaExecution: true } },
    },
    orderBy: { code: 'asc' },
  })

  return new Map(deliverables.map((deliverable) => [deliverable.code, deliverable]))
}

async function ensurePeopleAndVendors(orgId: string) {
  const peopleSeed = [
    {
      name: 'Naledi Mokoena',
      type: 'internal' as const,
      company: 'Example Mining Co',
      role: 'owner' as const,
      email: 'naledi.mokoena@example.com',
      phone: '+27 11 555 0101',
      notes: 'Operational readiness manager and accountable gate owner.',
    },
    {
      name: 'Pieter van Wyk',
      type: 'internal' as const,
      company: 'Example Mining Co',
      role: 'team' as const,
      email: 'pieter.vanwyk@example.com',
      phone: '+27 11 555 0102',
      notes: 'Mine services superintendent for power, dewatering, and ventilation readiness.',
    },
    {
      name: 'Aisha Khan',
      type: 'consultant' as const,
      company: 'OreReady Advisory',
      role: 'team' as const,
      email: 'aisha.khan@oreready.example',
      phone: '+27 11 555 0103',
      notes: 'Independent readiness assurance consultant.',
    },
    {
      name: 'Thabo Dlamini',
      type: 'contractor' as const,
      company: 'DeepTech Ventilation',
      role: 'team' as const,
      email: 'thabo.dlamini@deeptech.example',
      phone: '+27 11 555 0104',
      notes: 'Ventilation commissioning contractor lead.',
    },
    {
      name: 'Maria Ferreira',
      type: 'internal' as const,
      company: 'Example Mining Co',
      role: 'end_user' as const,
      email: 'maria.ferreira@example.com',
      phone: '+27 11 555 0105',
      notes: 'Control room shift lead and operational end-user representative.',
    },
    {
      name: 'Sibusiso Ndlovu',
      type: 'internal' as const,
      company: 'Example Mining Co',
      role: 'team' as const,
      email: 'sibusiso.ndlovu@example.com',
      phone: '+27 11 555 0106',
      notes: 'Maintenance planner responsible for CMMS and spares readiness.',
    },
  ]

  const vendorSeed = [
    {
      name: 'DeepTech Ventilation',
      type: 'service_provider' as const,
      contactName: 'Thabo Dlamini',
      contactRole: 'Commissioning Lead',
      email: 'projects@deeptech.example',
      phone: '+27 11 555 0201',
      address: '18 Foundry Road, Johannesburg',
      website: 'https://deeptech.example',
      notes: 'Ventilation fan commissioning and gas monitoring support.',
    },
    {
      name: 'MobiMine Equipment',
      type: 'supplier' as const,
      contactName: 'Lara Smith',
      contactRole: 'Key Account Manager',
      email: 'support@mobimine.example',
      phone: '+27 11 555 0202',
      address: '4 Diesel Avenue, Rustenburg',
      website: 'https://mobimine.example',
      notes: 'LHD fleet supplier and first 90-day support provider.',
    },
    {
      name: 'SafeMine Systems',
      type: 'supplier' as const,
      contactName: 'Ken Ito',
      contactRole: 'Systems Engineer',
      email: 'commissioning@safemine.example',
      phone: '+27 11 555 0203',
      address: '2 Control Loop Park, Centurion',
      website: 'https://safemine.example',
      notes: 'Gas monitoring, proximity detection, and control room integration.',
    },
    {
      name: 'OreReady Advisory',
      type: 'service_provider' as const,
      contactName: 'Aisha Khan',
      contactRole: 'Readiness Assurance Lead',
      email: 'assurance@oreready.example',
      phone: '+27 11 555 0204',
      address: '12 Readiness Lane, Sandton',
      website: 'https://oreready.example',
      notes: 'Independent operational readiness assurance.',
    },
  ]

  const people = new Map<string, Awaited<ReturnType<typeof prisma.person.create>>>()
  for (const person of peopleSeed) {
    const existing = await prisma.person.findFirst({
      where: { organizationId: orgId, email: person.email },
    })
    const record = existing
      ? await prisma.person.update({ where: { id: existing.id }, data: person })
      : await prisma.person.create({ data: { organizationId: orgId, ...person } })
    people.set(record.name, record)
  }

  const vendors = new Map<string, Awaited<ReturnType<typeof prisma.vendor.create>>>()
  for (const vendor of vendorSeed) {
    const existing = await prisma.vendor.findFirst({
      where: { organizationId: orgId, name: vendor.name },
    })
    const record = existing
      ? await prisma.vendor.update({ where: { id: existing.id }, data: vendor })
      : await prisma.vendor.create({ data: { organizationId: orgId, ...vendor } })
    vendors.set(record.name, record)
  }

  return { people, vendors }
}

async function updateDeliverableRuntimeData(
  orgId: string,
  projectId: string,
  deliverables: Map<string, Awaited<ReturnType<typeof prisma.deliverableExecution.findFirstOrThrow>>>,
  people: Map<string, Awaited<ReturnType<typeof prisma.person.create>>>,
  vendors: Map<string, Awaited<ReturnType<typeof prisma.vendor.create>>>,
) {
  const assignments = [
    { code: 'GOV-REG-001', status: 'closed' as const, owner: 'Naledi Mokoena', start: -60, target: -35, vendors: ['OreReady Advisory'] },
    { code: 'GOV-REG-002', status: 'closed' as const, owner: 'Aisha Khan', start: -58, target: -30, vendors: ['OreReady Advisory'] },
    { code: 'GOV-CONTROL-001', status: 'closed' as const, owner: 'Naledi Mokoena', start: -32, target: -18, vendors: ['OreReady Advisory'] },
    { code: 'GOV-CONTROL-002', status: 'in_progress' as const, owner: 'Maria Ferreira', start: -28, target: 10, vendors: ['OreReady Advisory'] },
    { code: 'INF-POWER-001', status: 'in_progress' as const, owner: 'Pieter van Wyk', start: -21, target: 12, vendors: ['SafeMine Systems'] },
    { code: 'INF-POWER-002', status: 'delayed' as const, owner: 'Pieter van Wyk', start: -18, target: -2, vendors: ['SafeMine Systems'] },
    { code: 'INF-VENT-001', status: 'in_progress' as const, owner: 'Thabo Dlamini', start: -12, target: 20, vendors: ['DeepTech Ventilation'] },
    { code: 'INF-VENT-002', status: 'planned' as const, owner: 'Thabo Dlamini', start: 5, target: 28, vendors: ['DeepTech Ventilation', 'SafeMine Systems'] },
    { code: 'MOB-FLEET-001', status: 'in_progress' as const, owner: 'Sibusiso Ndlovu', start: -16, target: 14, vendors: ['MobiMine Equipment'] },
    { code: 'MOB-FLEET-002', status: 'planned' as const, owner: 'Maria Ferreira', start: 12, target: 38, vendors: ['MobiMine Equipment', 'SafeMine Systems'] },
    { code: 'MOB-MAINT-001', status: 'closed' as const, owner: 'Sibusiso Ndlovu', start: -52, target: -20, vendors: ['MobiMine Equipment'] },
    { code: 'MOB-MAINT-002', status: 'in_progress' as const, owner: 'Sibusiso Ndlovu', start: -25, target: 8, vendors: ['MobiMine Equipment'] },
    { code: 'PEO-ORG-001', status: 'closed' as const, owner: 'Naledi Mokoena', start: -55, target: -25, vendors: [] },
    { code: 'PEO-ORG-002', status: 'in_progress' as const, owner: 'Maria Ferreira', start: -10, target: 15, vendors: ['SafeMine Systems'] },
    { code: 'PEO-TRAIN-001', status: 'in_progress' as const, owner: 'Naledi Mokoena', start: -35, target: 5, vendors: [] },
    { code: 'PEO-TRAIN-002', status: 'planned' as const, owner: 'Aisha Khan', start: 8, target: 35, vendors: ['OreReady Advisory'] },
    { code: 'HND-RAMP-001', status: 'planned' as const, owner: 'Naledi Mokoena', start: 25, target: 55, vendors: [] },
    { code: 'HND-RAMP-002', status: 'planned' as const, owner: 'Maria Ferreira', start: 28, target: 60, vendors: [] },
    { code: 'HND-OPS-001', status: 'planned' as const, owner: 'Pieter van Wyk', start: 50, target: 85, vendors: ['OreReady Advisory'] },
    { code: 'HND-OPS-002', status: 'planned' as const, owner: 'Naledi Mokoena', start: 78, target: 105, vendors: ['OreReady Advisory'] },
  ]

  for (const assignment of assignments) {
    const deliverable = deliverables.get(assignment.code)
    const owner = people.get(assignment.owner)
    if (!deliverable || !owner) continue

    await prisma.deliverableExecution.update({
      where: { id: deliverable.id },
      data: {
        status: assignment.status,
        ownerId: owner.id,
        startDate: daysFromNow(assignment.start),
        targetDate: daysFromNow(assignment.target),
        closedAt: assignment.status === 'closed' ? daysFromNow(Math.min(assignment.target, -1)) : null,
        notes:
          assignment.status === 'delayed'
            ? 'Delayed by late pump control panel delivery. Recovery plan agreed with supplier and mine services.'
            : 'Seeded readiness plan item with accountable owner, dates, and evidence requirements.',
      },
    })

    await prisma.deliverableExecutionPerson.upsert({
      where: { deliverableExecutionId_personId: { deliverableExecutionId: deliverable.id, personId: owner.id } },
      update: {},
      create: { deliverableExecutionId: deliverable.id, personId: owner.id },
    })

    for (const vendorName of assignment.vendors) {
      const vendor = vendors.get(vendorName)
      if (!vendor) continue
      await prisma.deliverableExecutionVendor.upsert({
        where: { deliverableExecutionId_vendorId: { deliverableExecutionId: deliverable.id, vendorId: vendor.id } },
        update: {},
        create: { deliverableExecutionId: deliverable.id, vendorId: vendor.id },
      })
    }

    await ensureAuditEvent({
      organizationId: orgId,
      projectId,
      deliverableExecutionId: deliverable.id,
      actorName: owner.name,
      eventType: 'deliverable.status_changed',
      description: `Seeded deliverable status as "${assignment.status}"`,
      metadata: { status: assignment.status, code: assignment.code },
      createdAt: daysFromNow(assignment.status === 'closed' ? -14 : -5),
    })
  }
}

async function ensureEvidenceAndChecklist(
  orgId: string,
  projectId: string,
  deliverables: Map<string, Awaited<ReturnType<typeof prisma.deliverableExecution.findFirstOrThrow>>>,
) {
  const evidenceSeed = [
    { code: 'GOV-REG-001', req: 'Approved licence readiness matrix', name: 'Licence readiness matrix v1.0.xlsx', type: 'document' as const, verified: true, by: 'Naledi Mokoena' },
    { code: 'GOV-REG-001', req: 'Regulator correspondence pack', name: 'Regulator correspondence pack.pdf', type: 'document' as const, verified: true, by: 'Aisha Khan' },
    { code: 'GOV-REG-002', req: 'Approved principal hazard management plans', name: 'Principal hazard plans approval pack.pdf', type: 'document' as const, verified: true, by: 'Aisha Khan' },
    { code: 'GOV-CONTROL-001', req: 'Readiness gate checklist', name: 'Readiness gate checklist signed.pdf', type: 'document' as const, verified: true, by: 'Naledi Mokoena' },
    { code: 'INF-POWER-001', req: 'Electrical commissioning dossier', name: 'UG electrical commissioning dossier draft.pdf', type: 'document' as const, verified: false, by: 'Pieter van Wyk' },
    { code: 'INF-POWER-001', req: 'Field labelling photo set', name: 'Substation labelling photos.zip', type: 'image' as const, verified: false, by: 'Pieter van Wyk' },
    { code: 'INF-POWER-002', req: 'Dewatering commissioning test pack', name: 'Dewatering pump test pack partial.pdf', type: 'document' as const, verified: false, by: 'Pieter van Wyk' },
    { code: 'MOB-MAINT-001', req: 'CMMS asset hierarchy extract', name: 'CMMS hierarchy extract.csv', type: 'document' as const, verified: true, by: 'Sibusiso Ndlovu' },
    { code: 'MOB-MAINT-002', req: 'Critical spares readiness report', name: 'Critical spares availability report.xlsx', type: 'document' as const, verified: false, by: 'Sibusiso Ndlovu' },
    { code: 'PEO-ORG-001', req: 'Approved operating organisation chart', name: 'Operating organisation chart approved.pdf', type: 'document' as const, verified: true, by: 'Naledi Mokoena' },
    { code: 'PEO-TRAIN-001', req: 'Approved competency matrix', name: 'Role competency matrix.xlsx', type: 'document' as const, verified: false, by: 'Naledi Mokoena' },
    { code: 'HND-RAMP-001', req: 'Ramp-up KPI dashboard', name: 'Ramp-up KPI dashboard', type: 'link' as const, verified: false, by: 'Maria Ferreira', url: 'https://example.com/dashboards/ramp-up' },
  ]

  for (const item of evidenceSeed) {
    const deliverable = deliverables.get(item.code)
    if (!deliverable || !deliverable.templateDeliverableId) continue

    const requirement = await prisma.evidenceRequirement.findFirst({
      where: { deliverableTemplateId: deliverable.templateDeliverableId, name: item.req },
    })

    const existing = await prisma.evidence.findFirst({
      where: { organizationId: orgId, deliverableExecutionId: deliverable.id, name: item.name },
    })

    const data = {
      organizationId: orgId,
      deliverableExecutionId: deliverable.id,
      evidenceRequirementId: requirement?.id ?? null,
      name: item.name,
      type: item.type,
      url: item.url ?? publicEvidenceUrl(item.name.replace(/[^a-z0-9.]+/gi, '-').toLowerCase()),
      fileSize: item.type === 'link' ? null : 240000,
      uploadedBy: item.by,
      uploadedAt: daysFromNow(-4),
      verified: item.verified,
      verifiedAt: item.verified ? daysFromNow(-2) : null,
      verifiedBy: item.verified ? 'Aisha Khan' : null,
    }

    if (existing) {
      await prisma.evidence.update({ where: { id: existing.id }, data })
    } else {
      await prisma.evidence.create({ data })
    }
  }

  const completeCodes = ['GOV-REG-001', 'GOV-REG-002', 'GOV-CONTROL-001', 'MOB-MAINT-001', 'PEO-ORG-001']
  const partialCodes = ['INF-POWER-001', 'MOB-MAINT-002', 'PEO-TRAIN-001']

  for (const code of [...completeCodes, ...partialCodes]) {
    const deliverable = deliverables.get(code)
    if (!deliverable?.templateDeliverableId) continue

    const criteria = await prisma.acceptanceCriteria.findMany({
      where: { deliverableTemplateId: deliverable.templateDeliverableId },
      orderBy: { id: 'asc' },
    })

    const completedCount = completeCodes.includes(code) ? criteria.length : Math.max(1, Math.floor(criteria.length / 2))
    for (let index = 0; index < criteria.length; index += 1) {
      const criterion = criteria[index]
      const completed = index < completedCount
      await prisma.criteriaCompletion.upsert({
        where: {
          deliverableExecutionId_acceptanceCriteriaId: {
            deliverableExecutionId: deliverable.id,
            acceptanceCriteriaId: criterion.id,
          },
        },
        update: {
          completed,
          completedAt: completed ? daysFromNow(-3) : null,
          completedBy: completed ? 'Naledi Mokoena' : null,
          notes: completed ? 'Verified during seed readiness review.' : 'Remaining item pending closure evidence.',
        },
        create: {
          organizationId: orgId,
          deliverableExecutionId: deliverable.id,
          acceptanceCriteriaId: criterion.id,
          completed,
          completedAt: completed ? daysFromNow(-3) : null,
          completedBy: completed ? 'Naledi Mokoena' : null,
          notes: completed ? 'Verified during seed readiness review.' : 'Remaining item pending closure evidence.',
        },
      })
    }
  }

  const notesSeed = [
    { code: 'INF-POWER-002', authorName: 'Pieter van Wyk', text: 'Supplier confirmed revised control panel delivery for next Tuesday. Dewatering commissioning sequence has been resequenced to protect ventilation testing.' },
    { code: 'PEO-TRAIN-001', authorName: 'Naledi Mokoena', text: 'Competency matrix is complete for operations roles. Contractor medical and induction records still need final upload.' },
    { code: 'MOB-FLEET-001', authorName: 'Sibusiso Ndlovu', text: 'Two LHD units accepted. Final proximity detection test scheduled with SafeMine Systems before night-shift release.' },
  ]

  for (const note of notesSeed) {
    const deliverable = deliverables.get(note.code)
    if (!deliverable) continue
    const existing = await prisma.deliverableNote.findFirst({
      where: { organizationId: orgId, deliverableExecutionId: deliverable.id, text: note.text },
    })
    if (!existing) {
      await prisma.deliverableNote.create({
        data: {
          organizationId: orgId,
          deliverableExecutionId: deliverable.id,
          authorName: note.authorName,
          text: note.text,
        },
      })
    }
  }

  await ensureAuditEvent({
    organizationId: orgId,
    projectId,
    actorName: 'Aisha Khan',
    eventType: 'evidence.seeded',
    description: 'Seeded sample readiness evidence and checklist completions',
    createdAt: daysFromNow(-2),
  })
}

async function ensureRaidDecisionsReports(
  orgId: string,
  projectId: string,
  deliverables: Map<string, Awaited<ReturnType<typeof prisma.deliverableExecution.findFirstOrThrow>>>,
) {
  const raidSeed = [
    {
      type: 'risk' as const,
      title: 'Dewatering control panel delay may affect ventilation commissioning',
      description: 'Late panel delivery pushes integrated mine services testing and could delay the readiness gate.',
      severity: 'high' as const,
      likelihood: 'likely' as const,
      status: 'in_progress' as const,
      owner: 'Pieter van Wyk',
      dueDate: daysFromNow(7),
      mitigationPlan: 'Supplier daily expediting, temporary manual run procedure, and resequenced pump test plan.',
      codes: ['INF-POWER-002', 'INF-VENT-001'],
    },
    {
      type: 'issue' as const,
      title: 'Gas monitoring alarm simulation found one escalation gap',
      description: 'Control room received alarm but supervisor SMS route failed in the test environment.',
      severity: 'medium' as const,
      likelihood: 'possible' as const,
      status: 'open' as const,
      owner: 'Maria Ferreira',
      dueDate: daysFromNow(5),
      mitigationPlan: 'SafeMine Systems to correct SMS route and repeat integrated alarm response simulation.',
      codes: ['INF-VENT-002', 'PEO-ORG-002'],
    },
    {
      type: 'dependency' as const,
      title: 'Fleet telemetry depends on underground wireless coverage completion',
      description: 'Dispatch and production reporting cannot be fully validated until network coverage survey is complete.',
      severity: 'medium' as const,
      likelihood: 'possible' as const,
      status: 'open' as const,
      owner: 'Maria Ferreira',
      dueDate: daysFromNow(18),
      mitigationPlan: 'Use staged area-by-area testing and maintain manual dispatch fallback until coverage is signed off.',
      codes: ['MOB-FLEET-002'],
    },
    {
      type: 'assumption' as const,
      title: 'Initial ramp-up assumes two LHD units available per production shift',
      description: 'Ramp-up profile assumes two accepted LHD units with 80 percent availability in the first month.',
      severity: 'low' as const,
      likelihood: 'possible' as const,
      status: 'open' as const,
      owner: 'Sibusiso Ndlovu',
      dueDate: daysFromNow(30),
      mitigationPlan: 'Review LHD availability weekly and trigger revised production profile if availability falls below 70 percent.',
      codes: ['MOB-FLEET-001', 'HND-RAMP-001'],
    },
  ]

  for (const raid of raidSeed) {
    let item = await prisma.rAIDItem.findFirst({
      where: { organizationId: orgId, projectId, title: raid.title },
    })
    const data = {
      organizationId: orgId,
      projectId,
      type: raid.type,
      title: raid.title,
      description: raid.description,
      severity: raid.severity,
      likelihood: raid.likelihood,
      status: raid.status,
      owner: raid.owner,
      dueDate: raid.dueDate,
      mitigationPlan: raid.mitigationPlan,
      closedAt: null,
    }
    item = item ? await prisma.rAIDItem.update({ where: { id: item.id }, data }) : await prisma.rAIDItem.create({ data })

    for (const code of raid.codes) {
      const deliverable = deliverables.get(code)
      if (!deliverable) continue
      await prisma.rAIDItemDeliverable.upsert({
        where: {
          raidItemId_deliverableExecutionId: {
            raidItemId: item.id,
            deliverableExecutionId: deliverable.id,
          },
        },
        update: {},
        create: {
          raidItemId: item.id,
          deliverableExecutionId: deliverable.id,
        },
      })
    }
  }

  const decisions = [
    {
      description: 'Proceed to integrated mine services commissioning with dewatering control panel mitigation in place.',
      impact: 'Allows ventilation and power tests to continue while preserving a clear hold point before wet commissioning.',
      status: 'approved' as const,
      loggedBy: 'Naledi Mokoena',
      loggedDate: daysFromNow(-6),
      comments: 'Sponsor approved conditional progression at readiness stand-up.',
    },
    {
      description: 'Defer full fleet dispatch go-live until underground wireless survey is complete.',
      impact: 'Manual dispatch remains active for initial fleet acceptance, reducing systems risk during first underground trials.',
      status: 'deferred' as const,
      loggedBy: 'Maria Ferreira',
      loggedDate: daysFromNow(-3),
      comments: 'Decision to be revisited after SafeMine Systems coverage report.',
    },
  ]

  for (const decision of decisions) {
    const existing = await prisma.decision.findFirst({
      where: { organizationId: orgId, projectId, description: decision.description },
    })
    if (existing) {
      await prisma.decision.update({ where: { id: existing.id }, data: decision })
    } else {
      await prisma.decision.create({ data: { organizationId: orgId, projectId, ...decision } })
    }
  }

  const totalDeliverables = deliverables.size
  const closedDeliverables = Array.from(deliverables.values()).filter((deliverable) => deliverable.status === 'closed').length
  const readinessPct = totalDeliverables === 0 ? 0 : Math.round((closedDeliverables / totalDeliverables) * 100)
  const openRisks = await prisma.rAIDItem.count({ where: { organizationId: orgId, projectId, status: { not: 'closed' }, type: 'risk' } })
  const evidenceItems = await prisma.evidence.findMany({
    where: { organizationId: orgId, deliverableExecution: { subSectionExecution: { focusAreaExecution: { projectId } } } },
    orderBy: { uploadedAt: 'desc' },
    take: 10,
  })

  const report = await prisma.report.findFirst({
    where: { organizationId: orgId, projectId, title: 'Mokopane Decline Readiness Weekly Report' },
  })

  const reportData = {
    organizationId: orgId,
    projectId,
    title: 'Mokopane Decline Readiness Weekly Report',
    reportType: 'executive_summary' as const,
    status: 'published' as const,
    createdBy: 'Naledi Mokoena',
    periodStart: daysFromNow(-14),
    periodEnd: daysFromNow(0),
    publishedAt: daysFromNow(-1),
  }

  const currentReport = report
    ? await prisma.report.update({ where: { id: report.id }, data: reportData })
    : await prisma.report.create({ data: reportData })

  await prisma.reportSection.deleteMany({ where: { reportId: currentReport.id } })
  await prisma.reportSection.createMany({
    data: [
      {
        reportId: currentReport.id,
        type: 'executive_overview',
        title: 'Executive Overview',
        sortOrder: 0,
        content: {
          projectName: 'Mokopane Decline Restart Readiness',
          projectStatus: 'active',
          templateName: 'Underground Mine Operational Readiness',
          readinessPct,
          totalDeliverables,
          closedDeliverables,
          openRisks,
          periodStart: daysFromNow(-14),
          periodEnd: daysFromNow(0),
        },
        comment: 'Mine readiness is progressing through commissioning, with dewatering and alarm escalation as the main active constraints.',
      },
      {
        reportId: currentReport.id,
        type: 'key_risks',
        title: 'Key Risks and Issues',
        sortOrder: 1,
        content: {
          items: await prisma.rAIDItem.findMany({
            where: { organizationId: orgId, projectId, status: { not: 'closed' } },
            select: { type: true, title: true, severity: true, status: true, owner: true, dueDate: true },
          }),
        },
        comment: 'The team is tracking all open RAID items through daily commissioning stand-ups.',
      },
      {
        reportId: currentReport.id,
        type: 'evidence_summary',
        title: 'Evidence Summary',
        sortOrder: 2,
        content: {
          totalEvidence: evidenceItems.length,
          verifiedEvidence: evidenceItems.filter((item) => item.verified).length,
          recentItems: evidenceItems.map((item) => ({
            name: item.name,
            type: item.type,
            verified: item.verified,
            uploadedAt: item.uploadedAt,
            uploadedBy: item.uploadedBy,
          })),
        },
        comment: 'Verified evidence currently concentrates on governance, hazard management, and organisation readiness.',
      },
    ],
  })

  const accessCount = await prisma.reportAccess.count({ where: { reportId: currentReport.id } })
  if (accessCount === 0) {
    await prisma.reportAccess.createMany({
      data: [
        { reportId: currentReport.id, accessedBy: 'viewer@example.com', ipAddress: '127.0.0.1', userAgent: 'Seed QA browser', accessedAt: daysFromNow(-1) },
        { reportId: currentReport.id, accessedBy: 'sponsor@example.com', ipAddress: '127.0.0.1', userAgent: 'Seed public report view', accessedAt: daysFromNow(0) },
      ],
    })
  }

  await ensureAuditEvent({
    organizationId: orgId,
    projectId,
    actorName: 'Naledi Mokoena',
    eventType: 'report.published',
    description: 'Seeded published weekly readiness report',
    createdAt: daysFromNow(-1),
  })
}

async function main() {
  console.log('Seeding dev data...')

  const hash = (password: string) => bcrypt.hash(password, 12)

  const org = await prisma.organization.upsert({
    where: { slug: 'example-mining-co' },
    update: { name: 'Example Mining Co' },
    create: { name: 'Example Mining Co', slug: 'example-mining-co' },
  })

  await prisma.organizationSettings.upsert({
    where: { organizationId: org.id },
    update: {
      description: 'Demo tenant for mining operational readiness planning, evidence collection, RAID management, and reporting.',
      timezone: 'Africa/Johannesburg',
      dateFormat: 'DD/MM/YYYY',
      storageProvider: 'local',
      notifyEmail: true,
      notifyReminders: true,
      notifyRaid: true,
      notifyDigest: true,
      ssoEnabled: false,
    },
    create: {
      organizationId: org.id,
      description: 'Demo tenant for mining operational readiness planning, evidence collection, RAID management, and reporting.',
      timezone: 'Africa/Johannesburg',
      dateFormat: 'DD/MM/YYYY',
      storageProvider: 'local',
      notifyEmail: true,
      notifyReminders: true,
      notifyRaid: true,
      notifyDigest: true,
      ssoEnabled: false,
    },
  })

  const accounts = [
    { name: 'Admin User', email: 'admin@example.com', role: 'owner' as const },
    { name: 'Member User', email: 'member@example.com', role: 'member' as const },
    { name: 'Viewer User', email: 'viewer@example.com', role: 'viewer' as const },
  ]

  for (const { name, email, role } of accounts) {
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { name, email, passwordHash: await hash('password123') },
    })

    await prisma.organizationMembership.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
      update: { role },
      create: { userId: user.id, organizationId: org.id, role },
    })
  }

  // Second org — admin@example.com is a member of both so they can test org switching
  const org2 = await prisma.organization.upsert({
    where: { slug: 'apex-resources' },
    update: { name: 'Apex Resources' },
    create: { name: 'Apex Resources', slug: 'apex-resources' },
  })

  await prisma.organizationSettings.upsert({
    where: { organizationId: org2.id },
    update: {},
    create: {
      organizationId: org2.id,
      description: 'Second demo tenant for testing multi-org switching.',
      timezone: 'Australia/Perth',
      dateFormat: 'DD/MM/YYYY',
      storageProvider: 'local',
      notifyEmail: true,
      notifyReminders: true,
      notifyRaid: true,
      notifyDigest: true,
      ssoEnabled: false,
    },
  })

  const adminUser = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@example.com' } })
  await prisma.organizationMembership.upsert({
    where: { organizationId_userId: { organizationId: org2.id, userId: adminUser.id } },
    update: { role: 'admin' },
    create: { userId: adminUser.id, organizationId: org2.id, role: 'admin' },
  })
  console.log('admin@example.com is now a member of both Example Mining Co and Apex Resources')

  await prisma.invite.upsert({
    where: { token: 'seed-safety-lead-invite' },
    update: {
      organizationId: org.id,
      email: 'safety.lead@example.com',
      role: 'member',
      status: 'pending',
      invitedBy: 'Admin User',
      expiresAt: daysFromNow(14),
    },
    create: {
      organizationId: org.id,
      email: 'safety.lead@example.com',
      role: 'member',
      token: 'seed-safety-lead-invite',
      status: 'pending',
      invitedBy: 'Admin User',
      expiresAt: daysFromNow(14),
    },
  })

  const underground = await ensureTemplate(org.id, undergroundTemplate)
  await ensureTemplate(org.id, processingPlantTemplate)

  await ensureAuditEvent({
    organizationId: org.id,
    templateId: underground.id,
    actorName: 'Admin User',
    eventType: 'template.seeded',
    description: 'Seeded comprehensive mining readiness templates',
    metadata: { templates: [undergroundTemplate.name, processingPlantTemplate.name] },
    createdAt: daysFromNow(-45),
  })

  const project = await ensureProjectFromTemplate(org.id, underground.id, {
    name: 'Mokopane Decline Restart Readiness',
    description:
      'Operational readiness plan for restarting an underground decline, validating mine services, fleet, statutory controls, training, and handover evidence before first ore.',
    status: 'active',
    startDate: daysFromNow(-60),
    targetDate: daysFromNow(105),
  })

  await ensureProjectFromTemplate(org.id, underground.id, {
    name: 'Northern Shaft Expansion Readiness',
    description:
      'Early-stage readiness plan for a shaft expansion project, kept mostly planned so dashboards show future workload.',
    status: 'active',
    startDate: daysFromNow(10),
    targetDate: daysFromNow(180),
  })

  const { people, vendors } = await ensurePeopleAndVendors(org.id)
  let deliverables = await getProjectDeliverables(project.id, org.id)

  await updateDeliverableRuntimeData(org.id, project.id, deliverables, people, vendors)
  deliverables = await getProjectDeliverables(project.id, org.id)

  await ensureEvidenceAndChecklist(org.id, project.id, deliverables)
  await ensureRaidDecisionsReports(org.id, project.id, deliverables)

  await ensureAuditEvent({
    organizationId: org.id,
    projectId: project.id,
    actorName: 'Admin User',
    eventType: 'seed.completed',
    description: 'Seed completed for mining templates and demo operational readiness data',
    createdAt: daysFromNow(0),
  })

  console.log('Seed complete.')
  console.log('Login accounts: admin@example.com, member@example.com, viewer@example.com / password123')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
