import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export const dynamic = 'force-dynamic'

const templateRows = [
  { Field: 'Name', Value: 'Mining Operational Readiness Sample' },
  { Field: 'Description', Value: 'Sample import template for commissioning readiness deliverables.' },
  { Field: 'Industry', Value: 'Mining & Resources' },
  { Field: 'Version', Value: '1.0' },
]

const deliverableRows = [
  {
    'Focus Area Code': 'MOB',
    'Focus Area Name': 'Mobilisation',
    'Sub-section Code': 'MOB-SITE',
    'Sub-section Name': 'Site establishment',
    'Deliverable Code': 'MOB-SITE-001',
    'Deliverable Name': 'Site mobilisation plan approved',
    Description: 'Confirm site establishment, access, and logistics are ready for mobilisation.',
    Phase: 'pre_commissioning',
    Domain: 'Operations',
    'Estimated Duration': 5,
    'Acceptance Criteria': 'Plan approved by project sponsor | Document review\nAccess constraints resolved | Stakeholder sign-off',
    'Evidence Requirements': 'Approved mobilisation plan | document | required | Signed PDF or controlled document\nAccess approval | document | optional | Permit or approval email',
  },
  {
    'Focus Area Code': 'COM',
    'Focus Area Name': 'Commissioning',
    'Sub-section Code': 'COM-SYS',
    'Sub-section Name': 'Systems commissioning',
    'Deliverable Code': 'COM-SYS-001',
    'Deliverable Name': 'Commissioning test packs completed',
    Description: 'Verify required test packs are complete before handover.',
    Phase: 'commissioning',
    Domain: 'Engineering',
    'Estimated Duration': 10,
    'Acceptance Criteria': 'All critical test packs signed | Test pack review',
    'Evidence Requirements': 'Signed test packs | document | required | Completed test pack bundle',
  },
]

const instructionRows = [
  { Column: 'Template sheet', Notes: 'Keep the Field and Value columns. Name is required; Description, Industry, and Version are optional.' },
  { Column: 'Deliverables sheet', Notes: 'Each row creates one deliverable. Reuse the same focus area and sub-section codes to group rows.' },
  { Column: 'Phase', Notes: 'Use one of: pre_commissioning, commissioning, ramp_up, handover.' },
  { Column: 'Acceptance Criteria', Notes: 'Put one item per line. Use "Description | Verification Method" when you want to include a method.' },
  { Column: 'Evidence Requirements', Notes: 'Put one item per line. Use "Name | Type | Required | Description". Required can be required, optional, yes, or no.' },
]

export async function GET() {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'S-Planned'
  workbook.created = new Date()

  const addSheet = (name: string, rows: Array<Record<string, string | number>>) => {
    const worksheet = workbook.addWorksheet(name)
    const headers = Object.keys(rows[0] ?? {})
    worksheet.columns = headers.map((header) => ({ header, key: header, width: Math.min(Math.max(header.length + 8, 18), 42) }))
    worksheet.addRows(rows)
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).alignment = { vertical: 'middle', wrapText: true }
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'top', wrapText: true }
      })
    })
    return worksheet
  }

  addSheet('Template', templateRows)
  addSheet('Deliverables', deliverableRows)
  addSheet('Instructions', instructionRows)

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="s-planned-template-sample.xlsx"',
      'Cache-Control': 'no-store',
    },
  })
}
