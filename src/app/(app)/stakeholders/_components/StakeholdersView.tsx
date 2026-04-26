'use client'

import { useState } from 'react'
import {
  makeStyles,
  tokens,
  Text,
  Badge,
  Button,
  Input,
  TabList,
  Tab,
  DataGrid,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridBody,
  DataGridRow,
  DataGridCell,
  TableColumnDefinition,
  createTableColumn,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  useTableFeatures,
  useTableSort,
  Avatar,
} from '@fluentui/react-components'
import {
  AddRegular,
  SearchRegular,
  EditRegular,
  DeleteRegular,
  MoreHorizontalRegular,
  PersonRegular,
  BuildingRegular,
} from '@fluentui/react-icons'
import { PersonDialog } from './PersonDialog'
import { VendorDialog } from './VendorDialog'
import type { Person, Vendor } from '@prisma/client'

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalXL,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  search: {
    width: '280px',
  },
  typeLabel: {
    textTransform: 'capitalize',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
})

// ── People tab ────────────────────────────────────────────────────────────────

interface PeopleTabProps {
  people: Person[]
}

function PeopleTab({ people }: PeopleTabProps) {
  const styles = useStyles()
  const [search, setSearch] = useState('')
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selectedPerson, setSelectedPerson] = useState<Person | undefined>()

  const filtered = people.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.company?.toLowerCase().includes(q) ?? false) ||
      (p.email?.toLowerCase().includes(q) ?? false)
    )
  })

  const columns: TableColumnDefinition<Person>[] = [
    createTableColumn<Person>({
      columnId: 'name',
      compare: (a, b) => a.name.localeCompare(b.name),
      renderHeaderCell: () => 'Name',
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
          <Avatar name={item.name} size={28} />
          <Text>{item.name}</Text>
        </div>
      ),
    }),
    createTableColumn<Person>({
      columnId: 'type',
      compare: (a, b) => a.type.localeCompare(b.type),
      renderHeaderCell: () => 'Type',
      renderCell: (item) => (
        <Badge appearance="outline" className={styles.typeLabel}>
          {item.type.replace('_', ' ')}
        </Badge>
      ),
    }),
    createTableColumn<Person>({
      columnId: 'company',
      compare: (a, b) => (a.company ?? '').localeCompare(b.company ?? ''),
      renderHeaderCell: () => 'Company',
      renderCell: (item) => <Text>{item.company ?? '—'}</Text>,
    }),
    createTableColumn<Person>({
      columnId: 'role',
      compare: (a, b) => a.role.localeCompare(b.role),
      renderHeaderCell: () => 'Role',
      renderCell: (item) => (
        <Text className={styles.typeLabel}>{item.role.replace('_', ' ')}</Text>
      ),
    }),
    createTableColumn<Person>({
      columnId: 'email',
      compare: (a, b) => (a.email ?? '').localeCompare(b.email ?? ''),
      renderHeaderCell: () => 'Email',
      renderCell: (item) => <Text>{item.email ?? '—'}</Text>,
    }),
    createTableColumn<Person>({
      columnId: 'phone',
      compare: () => 0,
      renderHeaderCell: () => 'Phone',
      renderCell: (item) => <Text>{item.phone ?? '—'}</Text>,
    }),
    createTableColumn<Person>({
      columnId: 'actions',
      compare: () => 0,
      renderHeaderCell: () => '',
      renderCell: (item) => (
        <div className={styles.actions}>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button appearance="subtle" size="small" icon={<MoreHorizontalRegular />} />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={<EditRegular />}
                  onClick={() => { setSelectedPerson(item); setDialogMode('edit') }}
                >
                  Edit
                </MenuItem>
                <MenuItem
                  icon={<DeleteRegular />}
                  onClick={() => { setSelectedPerson(item); setDialogMode('delete') }}
                >
                  Delete
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      ),
    }),
  ]

  const { getRows, sort: { getSortDirection, toggleColumnSort } } = useTableFeatures(
    { columns, items: filtered },
    [useTableSort({ defaultSortState: { sortColumn: 'name', sortDirection: 'ascending' } })]
  )

  const rows = getRows()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
      <div className={styles.toolbar}>
        <Input
          className={styles.search}
          placeholder="Search by name, company, or email…"
          contentBefore={<SearchRegular />}
          value={search}
          onChange={(_, d) => setSearch(d.value)}
        />
        <Button
          appearance="primary"
          icon={<AddRegular />}
          onClick={() => { setSelectedPerson(undefined); setDialogMode('create') }}
        >
          Add Person
        </Button>
      </div>

      <DataGrid
        items={filtered}
        columns={columns}
        sortable
        getRowId={(item) => item.id}
        onSortChange={(e, state) => {
          if (state.sortColumn) toggleColumnSort(e, state.sortColumn)
        }}
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell, columnId }) => (
              <DataGridHeaderCell
                sortDirection={getSortDirection(columnId)}
              >
                {renderHeaderCell()}
              </DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<Person>>
          {({ item, rowId }) => (
            <DataGridRow<Person> key={rowId}>
              {({ renderCell }) => (
                <DataGridCell>{renderCell(item)}</DataGridCell>
              )}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>
          <PersonRegular style={{ fontSize: '40px', color: tokens.colorNeutralForeground3 }} />
          <Text block style={{ color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalS }}>
            {search ? 'No people match your search' : 'No people added yet'}
          </Text>
        </div>
      )}

      {dialogMode && (
        <PersonDialog
          open={!!dialogMode}
          onOpenChange={(o) => { if (!o) setDialogMode(null) }}
          person={selectedPerson}
          mode={dialogMode}
        />
      )}
    </div>
  )
}

// ── Vendors tab ───────────────────────────────────────────────────────────────

interface VendorsTabProps {
  vendors: Vendor[]
}

function VendorsTab({ vendors }: VendorsTabProps) {
  const styles = useStyles()
  const [search, setSearch] = useState('')
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | undefined>()

  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase()
    return (
      v.name.toLowerCase().includes(q) ||
      (v.contactName?.toLowerCase().includes(q) ?? false) ||
      (v.email?.toLowerCase().includes(q) ?? false)
    )
  })

  const columns: TableColumnDefinition<Vendor>[] = [
    createTableColumn<Vendor>({
      columnId: 'name',
      compare: (a, b) => a.name.localeCompare(b.name),
      renderHeaderCell: () => 'Company',
      renderCell: (item) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
          <Avatar name={item.name} size={28} shape="square" />
          <Text weight="semibold">{item.name}</Text>
        </div>
      ),
    }),
    createTableColumn<Vendor>({
      columnId: 'type',
      compare: (a, b) => a.type.localeCompare(b.type),
      renderHeaderCell: () => 'Type',
      renderCell: (item) => (
        <Badge appearance="outline" className={styles.typeLabel}>
          {item.type.replace('_', ' ')}
        </Badge>
      ),
    }),
    createTableColumn<Vendor>({
      columnId: 'contactName',
      compare: (a, b) => (a.contactName ?? '').localeCompare(b.contactName ?? ''),
      renderHeaderCell: () => 'Contact',
      renderCell: (item) => (
        <div>
          <Text>{item.contactName ?? '—'}</Text>
          {item.contactRole && (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{item.contactRole}</Text>
          )}
        </div>
      ),
    }),
    createTableColumn<Vendor>({
      columnId: 'email',
      compare: (a, b) => (a.email ?? '').localeCompare(b.email ?? ''),
      renderHeaderCell: () => 'Email',
      renderCell: (item) => <Text>{item.email ?? '—'}</Text>,
    }),
    createTableColumn<Vendor>({
      columnId: 'phone',
      compare: () => 0,
      renderHeaderCell: () => 'Phone',
      renderCell: (item) => <Text>{item.phone ?? '—'}</Text>,
    }),
    createTableColumn<Vendor>({
      columnId: 'actions',
      compare: () => 0,
      renderHeaderCell: () => '',
      renderCell: (item) => (
        <div className={styles.actions}>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button appearance="subtle" size="small" icon={<MoreHorizontalRegular />} />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={<EditRegular />}
                  onClick={() => { setSelectedVendor(item); setDialogMode('edit') }}
                >
                  Edit
                </MenuItem>
                <MenuItem
                  icon={<DeleteRegular />}
                  onClick={() => { setSelectedVendor(item); setDialogMode('delete') }}
                >
                  Delete
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      ),
    }),
  ]

  const { getRows, sort: { getSortDirection, toggleColumnSort } } = useTableFeatures(
    { columns, items: filtered },
    [useTableSort({ defaultSortState: { sortColumn: 'name', sortDirection: 'ascending' } })]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalM }}>
      <div className={styles.toolbar}>
        <Input
          className={styles.search}
          placeholder="Search by company, contact, or email…"
          contentBefore={<SearchRegular />}
          value={search}
          onChange={(_, d) => setSearch(d.value)}
        />
        <Button
          appearance="primary"
          icon={<AddRegular />}
          onClick={() => { setSelectedVendor(undefined); setDialogMode('create') }}
        >
          Add Vendor
        </Button>
      </div>

      <DataGrid
        items={filtered}
        columns={columns}
        sortable
        getRowId={(item) => item.id}
        onSortChange={(e, state) => {
          if (state.sortColumn) toggleColumnSort(e, state.sortColumn)
        }}
      >
        <DataGridHeader>
          <DataGridRow>
            {({ renderHeaderCell, columnId }) => (
              <DataGridHeaderCell sortDirection={getSortDirection(columnId)}>
                {renderHeaderCell()}
              </DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody<Vendor>>
          {({ item, rowId }) => (
            <DataGridRow<Vendor> key={rowId}>
              {({ renderCell }) => (
                <DataGridCell>{renderCell(item)}</DataGridCell>
              )}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>
          <BuildingRegular style={{ fontSize: '40px', color: tokens.colorNeutralForeground3 }} />
          <Text block style={{ color: tokens.colorNeutralForeground3, marginTop: tokens.spacingVerticalS }}>
            {search ? 'No vendors match your search' : 'No vendors added yet'}
          </Text>
        </div>
      )}

      {dialogMode && (
        <VendorDialog
          open={!!dialogMode}
          onOpenChange={(o) => { if (!o) setDialogMode(null) }}
          vendor={selectedVendor}
          mode={dialogMode}
        />
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface StakeholdersViewProps {
  people: Person[]
  vendors: Vendor[]
}

export function StakeholdersView({ people, vendors }: StakeholdersViewProps) {
  const styles = useStyles()
  const [activeTab, setActiveTab] = useState<'people' | 'vendors'>('people')

  return (
    <div className={styles.root}>
      <TabList
        selectedValue={activeTab}
        onTabSelect={(_, d) => setActiveTab(d.value as 'people' | 'vendors')}
      >
        <Tab value="people" icon={<PersonRegular />}>
          People ({people.length})
        </Tab>
        <Tab value="vendors" icon={<BuildingRegular />}>
          Vendors ({vendors.length})
        </Tab>
      </TabList>

      {activeTab === 'people' && <PeopleTab people={people} />}
      {activeTab === 'vendors' && <VendorsTab vendors={vendors} />}
    </div>
  )
}
