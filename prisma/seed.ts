import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding dev data…')

  const hash = (pw: string) => bcrypt.hash(pw, 12)

  // ── Organisation ─────────────────────────────────────────────────────────────
  let org = await prisma.organization.findUnique({ where: { slug: 'example-mining-co' } })
  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'Example Mining Co', slug: 'example-mining-co' },
    })
    console.log('Created org: Example Mining Co')
  }

  // ── Demo accounts ─────────────────────────────────────────────────────────────
  const accounts = [
    { name: 'Admin User',  email: 'admin@example.com',  role: 'owner'  as const },
    { name: 'Member User', email: 'member@example.com', role: 'member' as const },
    { name: 'Viewer User', email: 'viewer@example.com', role: 'viewer' as const },
  ]
  for (const { name, email, role } of accounts) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (!existing) {
      const user = await prisma.user.create({
        data: { name, email, passwordHash: await hash('password123') },
      })
      await prisma.organizationMembership.create({
        data: { userId: user.id, organizationId: org.id, role },
      })
      console.log(`Created ${role}: ${email}`)
    }
  }

  // ── Templates ─────────────────────────────────────────────────────────────────
  const existingTemplate = await prisma.template.findFirst({
    where: { organizationId: org.id, name: 'Mine Processing Plant Commissioning' },
  })
  if (existingTemplate) {
    console.log('Templates already seeded — skipping')
    return
  }

  await seedTemplate1(org.id)
  await seedTemplate2(org.id)
  await seedTemplate3(org.id)

  console.log('Seed complete.')
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 1: Mine Processing Plant Commissioning
// ─────────────────────────────────────────────────────────────────────────────
async function seedTemplate1(orgId: string) {
  console.log('Seeding: Mine Processing Plant Commissioning…')

  await prisma.template.create({
    data: {
      organizationId: orgId,
      name: 'Mine Processing Plant Commissioning',
      description: 'Full operational readiness program for mineral processing plant commissioning — from pre-commissioning through to operations handover. Covers mechanical, electrical, process, safety, environmental, and training workstreams.',
      industry: 'Mining & Resources',
      version: '2.1',
      focusAreas: {
        create: [

          // ── FA1: Safety & Environmental ──────────────────────────────────
          {
            code: 'SE', name: 'Safety & Environmental', order: 0,
            subSections: {
              create: [
                {
                  code: 'SE-01', name: 'Pre-Commissioning Safety', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'SE-01-01', name: 'Commissioning Safety Management Plan',
                        description: 'Documented safety management plan covering all commissioning activities, hazard identification, and control measures.',
                        phase: 'Pre-Commissioning', domain: 'Safety', estimatedDuration: 10,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Safety Management Plan reviewed and approved by HSE Manager', verificationMethod: 'Document review' },
                            { description: 'All commissioning personnel have signed the SMP acknowledgement', verificationMethod: 'Sign-off register' },
                            { description: 'Emergency response procedures are incorporated and communicated', verificationMethod: 'Training record review' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Approved Safety Management Plan', type: 'document', required: true },
                            { name: 'Personnel sign-off register', type: 'document', required: true },
                            { name: 'HSE Manager approval email', type: 'document', required: true },
                          ],
                        },
                      },
                      {
                        code: 'SE-01-02', name: 'Hazard and Operability Study (HAZOP)',
                        description: 'HAZOP study completed for all process systems prior to introduction of hazardous materials.',
                        phase: 'Pre-Commissioning', domain: 'Safety', estimatedDuration: 21,
                        acceptanceCriteria: {
                          create: [
                            { description: 'HAZOP completed for all process areas by qualified facilitator', verificationMethod: 'HAZOP report review' },
                            { description: 'All HAZOP action items closed out or risk-accepted', verificationMethod: 'Action item register' },
                            { description: 'HAZOP report signed off by Plant Manager and HSE', verificationMethod: 'Document approval' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'HAZOP Study Report', type: 'document', required: true },
                            { name: 'HAZOP Action Item Closeout Register', type: 'document', required: true },
                            { name: 'P&ID mark-ups used during HAZOP', type: 'document', required: false },
                          ],
                        },
                      },
                      {
                        code: 'SE-01-03', name: 'Isolation & Lockout/Tagout (LOTO) Procedures',
                        description: 'LOTO procedures developed and validated for all energy isolation points on the plant.',
                        phase: 'Pre-Commissioning', domain: 'Safety', estimatedDuration: 14,
                        acceptanceCriteria: {
                          create: [
                            { description: 'LOTO procedures developed for all major equipment items', verificationMethod: 'Document review' },
                            { description: 'All isolation points physically tagged and labelled on site', verificationMethod: 'Field verification walk' },
                            { description: 'Operators trained and competency assessed on LOTO procedures', verificationMethod: 'Training records' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'LOTO Procedures Register', type: 'document', required: true },
                            { name: 'Field verification sign-off sheet', type: 'document', required: true },
                            { name: 'Operator LOTO competency records', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  code: 'SE-02', name: 'Environmental Compliance', order: 1,
                  deliverables: {
                    create: [
                      {
                        code: 'SE-02-01', name: 'Environmental Impact Approval Conditions Review',
                        description: 'Review and register all conditions of environmental approval relevant to commissioning phase.',
                        phase: 'Pre-Commissioning', domain: 'Environmental', estimatedDuration: 7,
                        acceptanceCriteria: {
                          create: [
                            { description: 'All approval conditions extracted into a compliance register', verificationMethod: 'Document review' },
                            { description: 'Responsible owners assigned to each condition', verificationMethod: 'Register review' },
                            { description: 'Conditions requiring pre-commissioning actions identified and initiated', verificationMethod: 'Action tracking review' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Environmental Compliance Register', type: 'document', required: true },
                            { name: 'Environmental Approval Certificate', type: 'document', required: true },
                          ],
                        },
                      },
                      {
                        code: 'SE-02-02', name: 'Tailings Water Management Plan — Commissioning Phase',
                        description: 'Water management plan for process water during commissioning, covering containment, monitoring, and spill response.',
                        phase: 'Commissioning', domain: 'Environmental', estimatedDuration: 10,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Water balance model validated for commissioning flow rates', verificationMethod: 'Model review' },
                            { description: 'All secondary containment bunds inspected and certified', verificationMethod: 'Inspection certificate' },
                            { description: 'Spill response kits positioned at all chemical storage areas', verificationMethod: 'Field inspection' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Commissioning Water Management Plan', type: 'document', required: true },
                            { name: 'Bund inspection certificates', type: 'document', required: true },
                            { name: 'Water balance model', type: 'document', required: false },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },

          // ── FA2: Mechanical & Process Systems ────────────────────────────
          {
            code: 'MP', name: 'Mechanical & Process Systems', order: 1,
            subSections: {
              create: [
                {
                  code: 'MP-01', name: 'Crushing & Grinding Circuit', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'MP-01-01', name: 'Primary Crusher Pre-Commissioning Inspection',
                        description: 'Mechanical completion and pre-commissioning inspection of the primary crusher including all ancillary systems.',
                        phase: 'Pre-Commissioning', domain: 'Mechanical', estimatedDuration: 5,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Mechanical completion certificate issued by construction team', verificationMethod: 'Certificate review' },
                            { description: 'All fasteners checked to specified torque values', verificationMethod: 'Torque records' },
                            { description: 'Lubrication system flushed and oil samples taken', verificationMethod: 'Lab analysis report' },
                            { description: 'Guards and safety interlocks installed and tested', verificationMethod: 'Test records' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Mechanical Completion Certificate', type: 'document', required: true },
                            { name: 'Pre-commissioning checklist', type: 'document', required: true },
                            { name: 'Lubrication oil analysis report', type: 'document', required: true },
                            { name: 'Interlock test records', type: 'document', required: true },
                          ],
                        },
                      },
                      {
                        code: 'MP-01-02', name: 'SAG Mill No-Load Trial Run',
                        description: 'Conduct no-load trial run of the SAG mill to verify mechanical integrity before introduction of feed material.',
                        phase: 'Commissioning', domain: 'Mechanical', estimatedDuration: 3,
                        acceptanceCriteria: {
                          create: [
                            { description: 'No-load trial run completed for minimum 4 hours without fault', verificationMethod: 'Operations log' },
                            { description: 'Vibration and bearing temperatures within design limits', verificationMethod: 'Monitoring data' },
                            { description: 'All alarms and trips tested and confirmed functional', verificationMethod: 'Test records' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'No-load trial run log', type: 'document', required: true },
                            { name: 'Vibration monitoring report', type: 'document', required: true },
                            { name: 'Alarm and trip test records', type: 'document', required: true },
                          ],
                        },
                      },
                      {
                        code: 'MP-01-03', name: 'Grinding Circuit Water Trial',
                        description: 'Water-only trial of the full grinding circuit to verify slurry handling, pump performance, and instrumentation before ore introduction.',
                        phase: 'Commissioning', domain: 'Process', estimatedDuration: 7,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Water trial run for minimum 24 hours at design flow rate', verificationMethod: 'DCS historian data' },
                            { description: 'All process instruments calibrated and readings validated', verificationMethod: 'Calibration records' },
                            { description: 'Pump seal failures and leaks remediated', verificationMethod: 'Work order closeout' },
                            { description: 'Cyclone classification performance verified', verificationMethod: 'Particle size analysis' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Water trial run report', type: 'document', required: true },
                            { name: 'DCS trend data exports', type: 'document', required: true },
                            { name: 'Instrument calibration certificates', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  code: 'MP-02', name: 'Flotation Circuit', order: 1,
                  deliverables: {
                    create: [
                      {
                        code: 'MP-02-01', name: 'Flotation Cell Pre-Commissioning',
                        description: 'Mechanical inspection and pre-commissioning of all flotation cells, agitators, air systems, and level controls.',
                        phase: 'Pre-Commissioning', domain: 'Mechanical', estimatedDuration: 5,
                        acceptanceCriteria: {
                          create: [
                            { description: 'All cell impellers inspected for damage and clearance set per OEM spec', verificationMethod: 'Inspection records' },
                            { description: 'Air pipe connections tested for leaks', verificationMethod: 'Pressure test records' },
                            { description: 'Cell level controls calibrated and tested', verificationMethod: 'Calibration records' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Flotation cell pre-commissioning checklist', type: 'document', required: true },
                            { name: 'Impeller clearance measurement records', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },

          // ── FA3: Electrical & Instrumentation ────────────────────────────
          {
            code: 'EI', name: 'Electrical & Instrumentation', order: 2,
            subSections: {
              create: [
                {
                  code: 'EI-01', name: 'High Voltage Switchgear', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'EI-01-01', name: 'HV Switchgear Commissioning',
                        description: 'Commissioning of all high-voltage switchgear panels, protection relays, and interlocking systems.',
                        phase: 'Pre-Commissioning', domain: 'Electrical', estimatedDuration: 14,
                        acceptanceCriteria: {
                          create: [
                            { description: 'All HV switchgear panels inspected and cleared for energisation', verificationMethod: 'Inspection certificate' },
                            { description: 'Protection relay settings programmed and tested per relay settings schedule', verificationMethod: 'Test records' },
                            { description: 'HV interlock system tested for all fault scenarios', verificationMethod: 'Test records' },
                            { description: 'Energisation permit issued by electrical authority', verificationMethod: 'Permit documentation' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'HV switchgear commissioning report', type: 'document', required: true },
                            { name: 'Protection relay test records', type: 'document', required: true },
                            { name: 'Electrical authority energisation permit', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  code: 'EI-02', name: 'DCS / SCADA & Instrumentation', order: 1,
                  deliverables: {
                    create: [
                      {
                        code: 'EI-02-01', name: 'DCS Factory Acceptance Test (FAT)',
                        description: 'Factory acceptance testing of the distributed control system before site delivery.',
                        phase: 'Pre-Commissioning', domain: 'Controls', estimatedDuration: 5,
                        acceptanceCriteria: {
                          create: [
                            { description: 'All control loops tested and performing to P&ID requirements at FAT', verificationMethod: 'FAT report' },
                            { description: 'All alarms and trips configured and tested', verificationMethod: 'FAT report' },
                            { description: 'Client representatives sign off FAT report', verificationMethod: 'Signed FAT report' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Signed DCS FAT Report', type: 'document', required: true },
                            { name: 'FAT deficiency closeout list', type: 'document', required: true },
                          ],
                        },
                      },
                      {
                        code: 'EI-02-02', name: 'Site Acceptance Test (SAT) — DCS',
                        description: 'Site acceptance testing of the DCS following installation, verifying all field instruments, loops, and interlocks are functional.',
                        phase: 'Commissioning', domain: 'Controls', estimatedDuration: 21,
                        acceptanceCriteria: {
                          create: [
                            { description: '100% of control loops loop-checked and signed off', verificationMethod: 'Loop check sheets' },
                            { description: 'All safety interlocks function-tested end-to-end', verificationMethod: 'SIL test records' },
                            { description: 'DCS historian configured and data archiving verified', verificationMethod: 'Configuration report' },
                            { description: 'Operator workstations configured and HMI tested', verificationMethod: 'HMI acceptance record' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Loop check sheets (all instruments)', type: 'document', required: true },
                            { name: 'Interlock function test records', type: 'document', required: true },
                            { name: 'Signed SAT report', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },

          // ── FA4: Operations Readiness ─────────────────────────────────────
          {
            code: 'OR', name: 'Operations Readiness', order: 3,
            subSections: {
              create: [
                {
                  code: 'OR-01', name: 'Operating Procedures', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'OR-01-01', name: 'Standard Operating Procedures — All Process Areas',
                        description: 'Documented SOPs for all process areas and equipment covering startup, normal operation, shutdown, and abnormal conditions.',
                        phase: 'Commissioning', domain: 'Operations', estimatedDuration: 30,
                        acceptanceCriteria: {
                          create: [
                            { description: 'SOPs written for all major equipment and process areas', verificationMethod: 'Document register review' },
                            { description: 'SOPs reviewed by operations supervisor and HSE', verificationMethod: 'Approval records' },
                            { description: 'SOPs accessible to operators on site (hard copy or digital)', verificationMethod: 'Site verification' },
                            { description: 'All operators trained to relevant SOPs', verificationMethod: 'Training matrix' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Approved SOP Register', type: 'document', required: true },
                            { name: 'Operator training matrix showing SOP sign-offs', type: 'document', required: true },
                          ],
                        },
                      },
                      {
                        code: 'OR-01-02', name: 'Emergency Response Procedures',
                        description: 'Site-specific emergency response procedures covering all major hazard scenarios identified during HAZOP.',
                        phase: 'Pre-Commissioning', domain: 'Safety', estimatedDuration: 14,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Emergency procedures developed for: fire, chemical spill, medical emergency, equipment failure', verificationMethod: 'Document review' },
                            { description: 'Emergency response drills conducted with all shift crews', verificationMethod: 'Drill records' },
                            { description: 'Emergency contact list current and posted at muster points', verificationMethod: 'Site inspection' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Emergency Response Procedures document', type: 'document', required: true },
                            { name: 'Drill attendance and debrief records', type: 'document', required: true },
                            { name: 'Emergency contact list', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  code: 'OR-02', name: 'Maintenance Readiness', order: 1,
                  deliverables: {
                    create: [
                      {
                        code: 'OR-02-01', name: 'Maintenance Management System — Asset Load',
                        description: 'All plant assets loaded into the maintenance management system (MMS) with initial preventive maintenance schedules established.',
                        phase: 'Commissioning', domain: 'Maintenance', estimatedDuration: 21,
                        acceptanceCriteria: {
                          create: [
                            { description: 'All equipment assets created in MMS with correct hierarchy', verificationMethod: 'MMS asset report' },
                            { description: 'Preventive maintenance schedules loaded per OEM recommendations', verificationMethod: 'PM schedule report' },
                            { description: 'Critical spares identified and minimum stock levels set', verificationMethod: 'Spares register' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'MMS asset register export', type: 'document', required: true },
                            { name: 'PM schedule report', type: 'document', required: true },
                            { name: 'Critical spares register', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },

          // ── FA5: Training & Competency ────────────────────────────────────
          {
            code: 'TC', name: 'Training & Competency', order: 4,
            subSections: {
              create: [
                {
                  code: 'TC-01', name: 'Operator Training', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'TC-01-01', name: 'Operator Competency Assessments — All Roles',
                        description: 'Formal competency assessments completed for all operators prior to independent plant operation.',
                        phase: 'Ramp-Up', domain: 'Training', estimatedDuration: 14,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Competency framework defined for each operator role', verificationMethod: 'Framework document' },
                            { description: '100% of operators assessed against competency framework', verificationMethod: 'Competency records' },
                            { description: 'Operators with gaps have training plans in place', verificationMethod: 'Training plans' },
                            { description: 'Training records retained in HR system', verificationMethod: 'HR records audit' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Operator competency matrix (all roles)', type: 'document', required: true },
                            { name: 'Individual competency assessment records', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },

          // ── FA6: Handover & Documentation ─────────────────────────────────
          {
            code: 'HD', name: 'Handover & Documentation', order: 5,
            subSections: {
              create: [
                {
                  code: 'HD-01', name: 'As-Built Documentation', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'HD-01-01', name: 'As-Built P&ID Package',
                        description: 'Final as-built piping and instrumentation diagrams reflecting all field changes made during construction and commissioning.',
                        phase: 'Handover', domain: 'Engineering', estimatedDuration: 21,
                        acceptanceCriteria: {
                          create: [
                            { description: 'All P&IDs updated to reflect final field-installed configuration', verificationMethod: 'Document review' },
                            { description: 'As-built drawings signed off by engineer of record', verificationMethod: 'Approval stamps' },
                            { description: 'Drawings submitted to document control and issued to operations', verificationMethod: 'Document register' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'As-built P&ID set (PDF)', type: 'document', required: true },
                            { name: 'As-built P&ID set (native CAD files)', type: 'document', required: false },
                            { name: 'Drawing issue record', type: 'document', required: true },
                          ],
                        },
                      },
                      {
                        code: 'HD-01-02', name: 'Operations & Maintenance Manuals — Complete',
                        description: 'All vendor-supplied O&M manuals collected, organised, and handed over to the operations team.',
                        phase: 'Handover', domain: 'Engineering', estimatedDuration: 14,
                        acceptanceCriteria: {
                          create: [
                            { description: 'O&M manuals received for all major equipment items', verificationMethod: 'Document register' },
                            { description: 'Manuals indexed and stored in document management system', verificationMethod: 'DMS verification' },
                            { description: 'Operations team sign-off confirming receipt', verificationMethod: 'Handover record' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'O&M Manual Register', type: 'document', required: true },
                            { name: 'Operations team handover sign-off', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  code: 'HD-02', name: 'Performance Testing', order: 1,
                  deliverables: {
                    create: [
                      {
                        code: 'HD-02-01', name: 'Performance Acceptance Test (72-Hour Run)',
                        description: 'Sustained 72-hour performance test at nameplate capacity demonstrating the plant meets contractual design criteria.',
                        phase: 'Handover', domain: 'Process', estimatedDuration: 5,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Plant operates continuously for 72 hours at ≥95% of nameplate throughput', verificationMethod: 'DCS historian data' },
                            { description: 'Product metallurgical targets achieved (grade and recovery)', verificationMethod: 'Lab assay results' },
                            { description: 'Reagent consumption within design budget', verificationMethod: 'Reagent usage records' },
                            { description: 'No HSE incidents during performance test period', verificationMethod: 'Incident register' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Performance test report with DCS data', type: 'document', required: true },
                            { name: 'Assay results during test period', type: 'document', required: true },
                            { name: 'Signed performance acceptance certificate', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },

        ],
      },
    },
  })
  console.log('✓ Template 1: Mine Processing Plant Commissioning')
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 2: Underground Mine Development Readiness
// ─────────────────────────────────────────────────────────────────────────────
async function seedTemplate2(orgId: string) {
  console.log('Seeding: Underground Mine Development Readiness…')

  await prisma.template.create({
    data: {
      organizationId: orgId,
      name: 'Underground Mine Development Readiness',
      description: 'Operational readiness for underground mine development projects — decline portals, ventilation, electrical infrastructure, and production fleet readiness before first blast.',
      industry: 'Mining & Resources',
      version: '1.0',
      focusAreas: {
        create: [
          {
            code: 'GC', name: 'Ground Control & Geotechnical', order: 0,
            subSections: {
              create: [
                {
                  code: 'GC-01', name: 'Geotechnical Risk Assessment', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'GC-01-01', name: 'Underground Geotechnical Hazard Register',
                        description: 'Comprehensive hazard register identifying all geotechnical risks in planned development headings.',
                        phase: 'Pre-Development', domain: 'Geotechnical', estimatedDuration: 14,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Geotechnical engineer has reviewed drill core and rock mass classification', verificationMethod: 'Report review' },
                            { description: 'Hazard register completed for all planned headings', verificationMethod: 'Register review' },
                            { description: 'Critical control requirements documented per hazard', verificationMethod: 'Controls review' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Geotechnical Hazard Register', type: 'document', required: true },
                            { name: 'Rock mass classification report', type: 'document', required: true },
                          ],
                        },
                      },
                      {
                        code: 'GC-01-02', name: 'Ground Support Standards Approval',
                        description: 'Documented and approved ground support standards for all development headings based on geotechnical classification.',
                        phase: 'Pre-Development', domain: 'Geotechnical', estimatedDuration: 7,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Ground support standards defined for each rock mass classification zone', verificationMethod: 'Document review' },
                            { description: 'Standards reviewed and approved by Principal Geotechnical Engineer', verificationMethod: 'Approval record' },
                            { description: 'Underground supervisors trained on ground support standards', verificationMethod: 'Training records' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Ground Support Design Standard', type: 'document', required: true },
                            { name: 'Geotechnical Engineer approval sign-off', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            code: 'VE', name: 'Ventilation Systems', order: 1,
            subSections: {
              create: [
                {
                  code: 'VE-01', name: 'Primary Ventilation Infrastructure', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'VE-01-01', name: 'Ventilation Survey & Airflow Verification',
                        description: 'Ventilation survey completed confirming airflow meets regulatory minimums for all working areas and equipment.',
                        phase: 'Development', domain: 'Ventilation', estimatedDuration: 5,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Airflow measured at all development headings and fan installations', verificationMethod: 'Survey report' },
                            { description: 'Minimum 0.02 m³/s per kW of diesel equipment confirmed', verificationMethod: 'Calculation verification' },
                            { description: 'Regulatory authority accepts ventilation plan', verificationMethod: 'Authority acceptance' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Ventilation survey report', type: 'document', required: true },
                            { name: 'Regulatory authority acceptance letter', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            code: 'FL', name: 'Underground Fleet & Equipment', order: 2,
            subSections: {
              create: [
                {
                  code: 'FL-01', name: 'Development Fleet Readiness', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'FL-01-01', name: 'Jumbo Drill Rig Commissioning & Operator Certification',
                        description: 'Development jumbo drill rigs commissioned and all operators certified to operate equipment underground.',
                        phase: 'Development', domain: 'Equipment', estimatedDuration: 10,
                        acceptanceCriteria: {
                          create: [
                            { description: 'All jumbo rigs commissioned and OEM pre-start checklist completed', verificationMethod: 'Commissioning records' },
                            { description: 'Operators hold valid operator certification for each rig model', verificationMethod: 'Competency cards' },
                            { description: 'Pre-start inspection procedure implemented and practiced', verificationMethod: 'Pre-start records' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'OEM commissioning sign-off', type: 'document', required: true },
                            { name: 'Operator competency cards', type: 'document', required: true },
                          ],
                        },
                      },
                      {
                        code: 'FL-01-02', name: 'Explosive Magazine & Blasting Procedures',
                        description: 'Explosive storage facility approved and site blasting procedures in place before first development blast.',
                        phase: 'Development', domain: 'Safety', estimatedDuration: 14,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Explosive magazine constructed and licensed by explosives authority', verificationMethod: 'Licence documentation' },
                            { description: 'Site blasting procedures documented and approved', verificationMethod: 'Document approval' },
                            { description: 'Shot firers hold valid licences and are inducted to site procedures', verificationMethod: 'Licence and induction records' },
                            { description: 'Electronic blast initiation system tested and certified', verificationMethod: 'Test certificate' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Explosive magazine licence', type: 'document', required: true },
                            { name: 'Site Blasting Procedures', type: 'document', required: true },
                            { name: 'Shot firer licence copies', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            code: 'EP', name: 'Emergency Preparedness', order: 3,
            subSections: {
              create: [
                {
                  code: 'EP-01', name: 'Underground Emergency Response', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'EP-01-01', name: 'Refuge Chamber Installation & Testing',
                        description: 'Underground refuge chambers installed, stocked, and tested before personnel work beyond 300m from the portal.',
                        phase: 'Development', domain: 'Safety', estimatedDuration: 7,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Refuge chambers installed at required intervals per regulation', verificationMethod: 'Site inspection' },
                            { description: 'Chambers stocked with food, water, and first aid per specification', verificationMethod: 'Inventory check' },
                            { description: 'Air supply system tested and certified', verificationMethod: 'Test certificate' },
                            { description: 'All underground personnel trained in refuge chamber use', verificationMethod: 'Training records' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Refuge chamber installation certificate', type: 'document', required: true },
                            { name: 'Stock inventory sheet', type: 'document', required: true },
                            { name: 'Personnel training records', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  })
  console.log('✓ Template 2: Underground Mine Development Readiness')
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 3: Tailings Storage Facility (TSF) Commissioning
// ─────────────────────────────────────────────────────────────────────────────
async function seedTemplate3(orgId: string) {
  console.log('Seeding: Tailings Storage Facility Commissioning…')

  await prisma.template.create({
    data: {
      organizationId: orgId,
      name: 'Tailings Storage Facility (TSF) Commissioning',
      description: 'Readiness program for commissioning a new Tailings Storage Facility — from design verification through to first tailings discharge. Covers embankment integrity, monitoring, environmental controls, and emergency response.',
      industry: 'Mining & Resources',
      version: '1.2',
      focusAreas: {
        create: [
          {
            code: 'DV', name: 'Design Verification', order: 0,
            subSections: {
              create: [
                {
                  code: 'DV-01', name: 'Embankment Design Review', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'DV-01-01', name: 'Independent Technical Review of TSF Design',
                        description: 'Independent geotechnical engineer review of the full TSF design including stability analysis, seepage model, and water balance.',
                        phase: 'Design Review', domain: 'Engineering', estimatedDuration: 21,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Qualified independent reviewer (MAC standard) engaged', verificationMethod: 'Reviewer qualifications' },
                            { description: 'Stability analysis reviewed and minimum FoS confirmed for all loading conditions', verificationMethod: 'Review report' },
                            { description: 'All reviewer recommendations addressed in final design', verificationMethod: 'Response to recommendations' },
                            { description: 'Responsible Tailings Facility Engineer signs off final design', verificationMethod: 'Signed drawings' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Independent Technical Review Report', type: 'document', required: true },
                            { name: 'Response to Reviewer Recommendations', type: 'document', required: true },
                            { name: 'Signed final design drawings', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            code: 'CQ', name: 'Construction Quality Assurance', order: 1,
            subSections: {
              create: [
                {
                  code: 'CQ-01', name: 'Embankment Construction QA', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'CQ-01-01', name: 'Embankment Compaction Test Records',
                        description: 'Nuclear density and Proctor test results confirming embankment compaction meets design specification throughout construction.',
                        phase: 'Construction Verification', domain: 'Geotechnical', estimatedDuration: 0,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Testing frequency meets design specification (minimum 1 test per 500m²)', verificationMethod: 'Test frequency audit' },
                            { description: 'All test results at or above minimum relative compaction (95% modified Proctor)', verificationMethod: 'Test result review' },
                            { description: 'Failed tests have been remediated and re-tested', verificationMethod: 'Remediation records' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Compaction test results register', type: 'document', required: true },
                            { name: 'QA/QC final report', type: 'document', required: true },
                          ],
                        },
                      },
                      {
                        code: 'CQ-01-02', name: 'Liner System Installation Verification',
                        description: 'HDPE liner installation verified by CQA engineer including seam welding tests and vacuum box leak testing.',
                        phase: 'Construction Verification', domain: 'Engineering', estimatedDuration: 14,
                        acceptanceCriteria: {
                          create: [
                            { description: 'All liner seams destructive tested at specified frequency', verificationMethod: 'Test records' },
                            { description: 'Vacuum box testing completed across 100% of seam length', verificationMethod: 'Test records' },
                            { description: 'CQA engineer issues liner acceptance certificate', verificationMethod: 'Certificate' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Liner CQA report', type: 'document', required: true },
                            { name: 'Seam weld test records', type: 'document', required: true },
                            { name: 'Liner acceptance certificate', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            code: 'IM', name: 'Instrumentation & Monitoring', order: 2,
            subSections: {
              create: [
                {
                  code: 'IM-01', name: 'Embankment Monitoring Instruments', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'IM-01-01', name: 'Piezometer & Settlement Monitoring System — Commissioning',
                        description: 'All piezometers, settlement plates, and inclinometers installed, baselined, and connected to automated monitoring system.',
                        phase: 'Commissioning', domain: 'Geotechnical', estimatedDuration: 14,
                        acceptanceCriteria: {
                          create: [
                            { description: 'All instruments installed per design layout', verificationMethod: 'As-built survey' },
                            { description: 'Baseline readings established before first tailings discharge', verificationMethod: 'Baseline data report' },
                            { description: 'Automated monitoring system operational with alert thresholds set', verificationMethod: 'System configuration review' },
                            { description: 'Alert escalation protocol tested with all stakeholders', verificationMethod: 'Test record' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Instrument as-built layout', type: 'document', required: true },
                            { name: 'Baseline monitoring report', type: 'document', required: true },
                            { name: 'Alert system test record', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            code: 'EC', name: 'Environmental Controls', order: 3,
            subSections: {
              create: [
                {
                  code: 'EC-01', name: 'Seepage & Decant Management', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'EC-01-01', name: 'Seepage Collection System Operational',
                        description: 'Downstream seepage collection system (drain ponds, underdrains) operational and connected to return water system before first discharge.',
                        phase: 'Commissioning', domain: 'Environmental', estimatedDuration: 7,
                        acceptanceCriteria: {
                          create: [
                            { description: 'Underdrain outlets clear and freely draining', verificationMethod: 'Field inspection' },
                            { description: 'Collection pond capacity confirmed against water balance', verificationMethod: 'Survey data' },
                            { description: 'Return water pump station operational and tested', verificationMethod: 'Test record' },
                            { description: 'Groundwater monitoring wells baselined', verificationMethod: 'Baseline report' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Seepage system inspection report', type: 'document', required: true },
                            { name: 'Pump station commissioning record', type: 'document', required: true },
                            { name: 'Groundwater baseline report', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            code: 'ER', name: 'Emergency Response & Handover', order: 4,
            subSections: {
              create: [
                {
                  code: 'ER-01', name: 'Emergency Action Plan', order: 0,
                  deliverables: {
                    create: [
                      {
                        code: 'ER-01-01', name: 'TSF Emergency Action Plan (EAP)',
                        description: 'Documented Emergency Action Plan covering dam breach scenarios, notification protocols, and downstream evacuation.',
                        phase: 'Operations Handover', domain: 'Safety', estimatedDuration: 21,
                        acceptanceCriteria: {
                          create: [
                            { description: 'EAP developed in accordance with ANCOLD guidelines', verificationMethod: 'Document review' },
                            { description: 'Downstream community notified and EAP distributed to emergency services', verificationMethod: 'Distribution records' },
                            { description: 'Tabletop exercise conducted with all EAP stakeholders', verificationMethod: 'Exercise record' },
                            { description: 'EAP reviewed and signed by Responsible Tailings Facility Engineer', verificationMethod: 'Signed EAP' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Signed Emergency Action Plan', type: 'document', required: true },
                            { name: 'Distribution list and acknowledgements', type: 'document', required: true },
                            { name: 'Tabletop exercise record and debrief', type: 'document', required: true },
                          ],
                        },
                      },
                      {
                        code: 'ER-01-02', name: 'First Discharge Authorisation',
                        description: 'All pre-commissioning requirements satisfied and formal authorisation granted to commence first tailings discharge.',
                        phase: 'Operations Handover', domain: 'Management', estimatedDuration: 2,
                        acceptanceCriteria: {
                          create: [
                            { description: 'All Construction Completion Criteria items closed out', verificationMethod: 'Completion checklist' },
                            { description: 'Regulatory authority has confirmed no outstanding conditions', verificationMethod: 'Authority correspondence' },
                            { description: 'Senior management authorisation in writing', verificationMethod: 'Authorisation letter' },
                            { description: 'Operations team confirmed ready to receive tailings', verificationMethod: 'Operations readiness declaration' },
                          ],
                        },
                        evidenceRequirements: {
                          create: [
                            { name: 'Completion criteria closeout register', type: 'document', required: true },
                            { name: 'First discharge authorisation letter', type: 'document', required: true },
                            { name: 'Operations readiness declaration', type: 'document', required: true },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  })
  console.log('✓ Template 3: Tailings Storage Facility Commissioning')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
