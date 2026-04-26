# Product Requirements Document
# S-Planned — Operational Readiness Planning Platform

**Version:** 1.0  
**Date:** April 26, 2026  
**Status:** Draft

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Target Users & Personas](#2-target-users--personas)
3. [Core Concepts & Glossary](#3-core-concepts--glossary)
4. [Data Model](#4-data-model)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Multi-Tenancy & Organizations](#6-multi-tenancy--organizations)
7. [Feature Specifications](#7-feature-specifications)
   - 7.1 [Dashboard](#71-dashboard)
   - 7.2 [Projects](#72-projects)
   - 7.3 [Project Workspace (Deliverables)](#73-project-workspace-deliverables)
   - 7.4 [Deliverable Detail](#74-deliverable-detail)
   - 7.5 [RAID Log](#75-raid-log)
   - 7.6 [Decision Log](#76-decision-log)
   - 7.7 [Templates](#77-templates)
   - 7.8 [Template Gallery](#78-template-gallery)
   - 7.9 [Stakeholders](#79-stakeholders)
   - 7.10 [Analytics](#710-analytics)
   - 7.11 [Reports](#711-reports)
   - 7.12 [Settings](#712-settings)
   - 7.13 [Invite System](#713-invite-system)
8. [Navigation & Routing](#8-navigation--routing)
9. [Key Cross-Cutting Concerns](#9-key-cross-cutting-concerns)
10. [Build Sequence](#10-build-sequence)

---

## 1. Product Overview

**S-Planned** is a multi-tenant, web-based Operational Readiness Planning (ORP) platform. It enables teams in mining, manufacturing, construction, healthcare, and other project-intensive industries to plan, track, and evidence operational readiness activities before a facility, system, or service goes live.

The platform provides:
- **Structured deliverable management** driven by configurable templates
- **RAID log management** (Risks, Assumptions, Issues, Dependencies) linked to deliverables
- **Evidence collection** for each deliverable (documents, images, links, sign-offs)
- **Stakeholder management** (people and vendors) with links to work items
- **Executive reporting** with shareable public links
- **Audit trails** for all key actions
- **Multi-tenant isolation** so multiple organizations can use the same platform independently

### Goals
- Reduce the time and effort required to plan and evidence operational readiness
- Provide clear, real-time visibility of readiness status for project teams and executives
- Enable consistent, repeatable readiness processes through reusable templates
- Support regulated industries where evidence of readiness is a compliance requirement

---

## 2. Target Users & Personas

### Primary Personas

| Persona | Role | Core Needs |
|---------|------|------------|
| **Project Manager** | Owns the operational readiness plan | Create projects from templates, monitor overall progress, manage RAID, generate reports |
| **Readiness Coordinator** | Day-to-day management of deliverables | Update deliverable statuses, upload evidence, manage acceptance criteria, add notes |
| **Executive / Sponsor** | Decision-making oversight | Read-only view of progress, RAG status reports, key risks and decisions |
| **Subject Matter Expert (SME)** | Responsible for specific deliverables | View assigned deliverables, upload evidence, complete acceptance criteria |
| **System Administrator** | Manages the organization account | Configure SSO, email, storage, invite/manage members, manage templates |

### User Roles (per organization)

| Role | Permissions |
|------|-------------|
| `owner` | All permissions; non-removable from the organization |
| `admin` | All permissions; can manage members, settings, all data |
| `member` | Create and edit projects, deliverables, RAID items, templates, stakeholders |
| `viewer` | Read-only access across the organization |

---

## 3. Core Concepts & Glossary

| Term | Definition |
|------|------------|
| **Operational Readiness** | The process of ensuring a facility, system, or service is fully prepared to begin operations |
| **Organization** | A tenant account on the platform; all data is scoped to an organization |
| **Project** | A specific operational readiness effort (e.g., "Gold Mine Processing Plant Commissioning 2026") |
| **Template** | A reusable hierarchy of focus areas, sub-sections, and deliverable definitions that defines the structure of an operational readiness program |
| **Focus Area** | A high-level category grouping related deliverables (e.g., "Safety", "Training", "Equipment") |
| **Sub-Section** | A finer grouping within a focus area |
| **Deliverable Template** | A definition of a single readiness activity: what needs to be done, what evidence is required, and what criteria confirm completion |
| **Deliverable Execution** | A runtime instance of a deliverable template within a specific project — tracks the actual status, evidence, and team for that activity |
| **Acceptance Criteria** | Checkable statements that define when a deliverable is considered complete |
| **Evidence Requirement** | A named item of documentation or verification that must be collected |
| **RAID Item** | A tracked Risk, Assumption, Issue, or Dependency |
| **Decision** | A key project decision logged with date, impact, and status |
| **Report** | A generated, publishable snapshot of project readiness status |
| **Person** | An individual stakeholder (team member, contractor, consultant) |
| **Vendor** | A company or supplier involved in the project |
| **Audit Event** | An immutable log of a change or action on the platform |
| **Readiness %** | The percentage of deliverables in a project (or focus area/phase) that are in `closed` status |

### Deliverable Statuses

| Status | Meaning |
|--------|---------|
| `planned` | Not yet started |
| `in-progress` | Work has begun |
| `delayed` | Behind schedule or blocked |
| `closed` | Completed and accepted |

### Project Statuses

| Status | Meaning |
|--------|---------|
| `active` | Currently being worked on |
| `blocked` | Project-level blocker preventing progress |
| `completed` | All work finished |
| `archived` | No longer active; retained for reference |

### Project Phases

| Phase | Description |
|-------|-------------|
| `pre-commissioning` | Preparation activities before commissioning begins |
| `commissioning` | The commissioning phase itself |
| `ramp-up` | Increasing production/capacity toward full operation |
| `handover` | Final transfer to operational ownership |

### RAID Item Types and Attributes

**Types:** Risk · Assumption · Issue · Dependency  
**Severities:** `low` · `medium` · `high` · `critical`  
**Likelihoods:** `rare` · `unlikely` · `possible` · `likely` · `almost-certain`  
**Statuses:** `open` · `in-progress` · `closed`

---

## 4. Data Model

### Entities and Key Fields

#### User
- `id`, `email` (unique), `name`, `avatarUrl`
- Belongs to many organizations via `OrganizationMembership`

#### Organization
- `id`, `name`, `slug` (unique, used in URLs), `logoUrl`
- Has one `OrganizationSettings`
- Has many: Members, Projects, Templates, People, Vendors, Invites

#### OrganizationMembership
- Links `User` ↔ `Organization` with a `role` (`owner` / `admin` / `member` / `viewer`)

#### OrganizationSettings
- `timezone`, `dateFormat`
- Document storage configuration (provider + credentials)
- Identity Provider / SSO configuration (protocol + credentials)
- SMTP email configuration
- Notification preferences (email notifications, reminders, alerts, weekly digest)

#### Template
- `name`, `description`, `version`, `industry`
- Scoped to an organization (or shared/global with null organizationId)
- Has many `FocusArea` → `SubSection` → `DeliverableTemplate` (hierarchical)

#### FocusArea
- `code`, `name`, `description`, `sortOrder`
- Belongs to `Template`
- Has many `SubSection`

#### SubSection
- `code`, `name`, `description`, `sortOrder`
- Belongs to `FocusArea`
- Has many `DeliverableTemplate`

#### DeliverableTemplate
- `code`, `name`, `description`, `phase`, `domain`, `estimatedDuration`
- Has many `AcceptanceCriteria`
- Has many `EvidenceRequirement`
- Has many dependencies (self-referential many-to-many with other `DeliverableTemplate` records)

#### AcceptanceCriteria
- `description`, `verificationMethod`
- Belongs to `DeliverableTemplate`

#### EvidenceRequirement
- `name`, `description`, `type`, `required` (boolean)
- Belongs to `DeliverableTemplate`

#### Project
- `name`, `description`, `status`, `startDate`, `targetDate`
- Scoped to an `Organization`
- Created from a `Template`
- Has many: `DeliverableExecution`, `RAIDItem`, `AuditEvent`, `Report`, `Decision`, `Invite`

#### DeliverableExecution
- `status`, `assignee`, `overrideName`, `overrideDescription`
- `startDate`, `endDate`, `startedAt`, `completedAt`, `acceptedAt`, `acceptedBy`
- Belongs to `Project`, references `DeliverableTemplate`, `FocusArea`, `SubSection`
- Has one optional `owner` (Person)
- Has many (M:N): `Person`, `Vendor`
- Has many: `Evidence`, `CriteriaCompletion`, `DeliverableNote`, `AuditEvent`
- Linked (M:N) to `RAIDItem`

#### Evidence
- `name`, `type` (`document` / `image` / `link` / `sign-off`), `url`
- `uploadedAt`, `uploadedBy`, `verified` (boolean), `verifiedAt`, `verifiedBy`
- Belongs to `DeliverableExecution`; optionally linked to a specific `EvidenceRequirement`

#### CriteriaCompletion
- `completed` (boolean), `completedAt`, `completedBy`, `notes`
- Links `DeliverableExecution` ↔ `AcceptanceCriteria`

#### DeliverableNote
- `text`, `author`, `timestamp`
- Belongs to `DeliverableExecution`

#### RAIDItem
- `type`, `title`, `description`, `severity`, `likelihood`, `status`, `owner`, `dueDate`, `mitigationPlan`, `closedAt`
- Belongs to `Project`
- Linked (M:N) to `DeliverableExecution`

#### AuditEvent
- `action` (event type key), `description`, `actor`, `timestamp`, `metadata` (flexible JSON)
- Linked to `Project`, optionally to `DeliverableExecution`, optionally to `RAIDItem`

#### Decision
- `description`, `impact`, `loggedDate`, `status` (`pending` / `approved` / `rejected` / `deferred`), `comments`, `loggedBy`
- Belongs to `Project`

#### Report
- `title`, `reportType` (`detailed_activities` / `executive_summary`), `status` (`draft` / `published`)
- `shareToken` (UUID, unique — enables public access)
- `createdBy`, `periodStart`, `periodEnd`, `publishedAt`
- Belongs to `Project`
- Has many `ReportSection`
- Has many `ReportAccess` (access log records)

#### ReportSection
- `type`, `title`, `content` (JSON snapshot of data), `comment` (author narrative), `sortOrder`
- Belongs to `Report`

#### ReportAccess
- `accessedAt`, `accessedBy`, `ipAddress`, `userAgent`
- Belongs to `Report`

#### Person
- `name`, `type` (`internal` / `contractor` / `consultant`)
- `company`, `role` (`owner` / `team` / `end-user`), `email`, `phone`, `notes`
- Scoped to `Organization`
- Linked (M:N) to `DeliverableExecution`

#### Vendor
- `name`, `type` (`supplier` / `service-provider`)
- `contactName`, `contactRole`, `email`, `phone`, `address`, `website`, `notes`
- Scoped to `Organization`
- Linked (M:N) to `DeliverableExecution`

#### Invite
- `token` (UUID, unique), `email`, `role`, `status` (`pending` / `accepted` / `expired` / `revoked`)
- `expiresAt`, `acceptedAt`
- Scoped to `Organization`; optionally scoped to a `Project`
- Sent by a `User`

### Key Relationships Summary

```
Organization
  ├── many OrganizationMembership (User many-to-many)
  ├── one OrganizationSettings
  ├── many Template
  ├── many Project
  │     ├── many DeliverableExecution
  │     │     ├── many Evidence
  │     │     ├── many CriteriaCompletion
  │     │     ├── many DeliverableNote
  │     │     ├── many AuditEvent
  │     │     ├── many Person (M:N)
  │     │     └── many Vendor (M:N)
  │     ├── many RAIDItem (M:N linked to DeliverableExecution)
  │     ├── many AuditEvent
  │     ├── many Decision
  │     ├── many Report
  │     │     ├── many ReportSection
  │     │     └── many ReportAccess
  │     └── many Invite
  ├── many Person
  ├── many Vendor
  └── many Invite
```

---

## 5. Authentication & Authorization

### Registration
- Users register with email and password
- Password stored as a secure hash (never plaintext)
- On registration, an organization is created for the new user (who becomes its `owner`)

### Login
- Email + password credentials
- Support for OAuth providers (GitHub, Google, etc.) via the same account system
- On login, the user session exposes: user profile, current organization, all organization memberships

### Session
- Server-managed session (not client-side JWT alone)
- Session provides: user identity + role within current organization
- Switching between organizations changes the active organizational context

### Route Protection
- All application routes require authentication except:
  - `/landing` — public marketing page
  - `/use-cases` — public use-cases page
  - `/template-gallery` — public template gallery
  - `/login` — login page
  - `/register` — registration page
  - `/r/[token]` — shared report (public, token-based access)
  - `/invite/[token]` — invite acceptance page

### Authorization Rules
- `viewer`: read all data within their organization
- `member`: read + create/edit projects, deliverables, RAID items, templates, stakeholders
- `admin`: all member permissions + manage organization members, settings, invites
- `owner`: all admin permissions; cannot be removed from the organization; role cannot be changed

### SSO / Identity Provider (optional, per organization)
- Organizations can configure a third-party identity provider
- Supported protocols: **SAML** and **OIDC**
- Built-in configuration presets: Azure Entra ID, Okta, Google Workspace, Custom
- SAML fields: Entity ID, SSO URL, X.509 Certificate
- OIDC fields: Tenant ID, Client ID, Client Secret
- **Auto-provisioning** option: automatically create an org member account on first successful SSO login

---

## 6. Multi-Tenancy & Organizations

- Every piece of application data (projects, templates, people, vendors) is scoped to an `Organization`
- Users may belong to multiple organizations simultaneously
- The active organization is selected at login or via an organization switcher
- Organization slugs provide stable, human-readable URL segments
- Organization logo can be uploaded and displayed in the UI

---

## 7. Feature Specifications

---

### 7.1 Dashboard

**Route:** `/`  
**Access:** All authenticated users  
**Purpose:** Cross-project overview and activity feed for the current organization

#### Filters
- **Project selector:** "All Projects" or a specific project (dropdown)
- **Period selector:** This Week / Last Week / This Month / Last Month / All Time

#### Summary Statistics Row
- Total active projects (count)
- Total deliverables (count)
- Completed deliverables (count + percentage)
- Delayed or blocked deliverables (count)
- Open RAID items (count)

All stats respond to the selected project and period filters.

#### Project Progress Cards
- One card per project in the organization
- Each card shows:
  - Project name and status badge
  - Readiness percentage (circular progress indicator)
  - Deliverable counts: total / completed / delayed
  - Open RAID item count
  - Link to open the project

#### Activity Feed
- Chronological list of audit events, filtered by selected project and period
- Each event shows: icon indicating event type, actor name, human-readable description, timestamp
- Paginated
- Covers all significant event types including:
  - Deliverable status changes
  - Notes added
  - Evidence added or verified
  - Assignee / owner changes
  - People and vendors linked or unlinked
  - RAID items created, updated, deleted, linked, or unlinked
  - Acceptance criteria completed
  - Projects created

---

### 7.2 Projects

**Routes:** `/projects` (list), `/projects/new` (create), `/projects/[id]` (overview)

#### Project Listing (`/projects`)
- Grid layout of all projects in the organization
- Each project card shows: name, status badge, readiness %, deliverable counts, open RAID count
- Button to create a new project
- Cards link to the project overview

#### Create Project Wizard (`/projects/new`)

**Step 1 — Select Template**
- Display all templates available to the organization
- User selects one template to base the project on

**Step 2 — Project Details**
- Fields: Project name (required), Description, Start date, Target completion date

**On creation:**
- A `Project` record is created
- A `DeliverableExecution` record is created for every `DeliverableTemplate` in the chosen template, inheriting focus area, sub-section, phase, and acceptance criteria / evidence requirements
- User is redirected to the new project overview

#### Project Overview (`/projects/[id]`)

**Header area:**
- Project name, status badge (editable dropdown: `active` / `blocked` / `completed` / `archived`)
- Overall readiness percentage with progress ring
- Summary stat cards: total deliverables, completed, in-progress, delayed, open RAID items

**Focus Area Progress chart:**
- Horizontal bar chart showing completion percentage per focus area

**Phase Progress chart:**
- Bar or radial chart showing completion percentage per phase (pre-commissioning / commissioning / ramp-up / handover)

**RAID Summary widget:**
- Breakdown of open RAID items by type (R/A/I/D) and by severity

**Tabs within the project:**
- **Workspace** — deliverables management (see §7.3)
- **RAID** — RAID log (see §7.5)
- **Decisions** — decision log (see §7.6)

---

### 7.3 Project Workspace (Deliverables)

**Route:** `/projects/[id]/workspace`  
**Purpose:** View and manage all deliverables within a project

#### View Modes (toggle between):

1. **Grouped accordion view** — deliverables nested under Focus Area → Sub-Section collapsible groups
2. **Flat table view** — all deliverables in a sortable, paginated table
3. **Kanban board view** — columns for each status (`Planned` / `In Progress` / `Delayed` / `Closed`) with drag-and-drop to change status

#### Search & Filter Bar
- Text search: matches deliverable name, code, or description
- Status filter: All / Planned / In Progress / Delayed / Closed
- Phase filter: All / Pre-Commissioning / Commissioning / Ramp-Up / Handover
- Focus Area filter: All / (list of focus areas in the project)

#### Sorting (table view)
- Sortable columns: code, name, focus area, sub-section, phase, status, assignee, linked RAID count

#### Pagination
- 15 items per page in table and grouped views

#### Stats Bar
- Counts above the list: Total / Completed / In Progress / Delayed + percentage complete

#### Bulk Actions
- Checkboxes to select multiple deliverables
- Available bulk operations:
  - Change status (set all selected to a chosen status)
  - Set assignee (set all selected to a single assignee)
  - Add a note (apply same note to all selected)
  - Set target date (apply same end date to all selected)

#### Add Custom Deliverable
- Button to add a deliverable not defined in the template
- Fields: name, description, code, phase, focus area, sub-section

#### Kanban Card Quick Note
- From a kanban card, user can quickly add a comment note without navigating to the detail page

#### Navigation to Detail
- Clicking any deliverable opens its detail page (`/projects/[id]/deliverables/[delId]`)

---

### 7.4 Deliverable Detail

**Route:** `/projects/[id]/deliverables/[delId]`  
**Purpose:** Full view and management of a single deliverable execution

**Tabs:** Details · Evidence · Activity

---

#### Details Tab

**Inline-editable fields:**
- **Title** — overrides the template name for this specific execution
- **Description** — overrides the template description

**Status management:**
- Dropdown to change status (`planned` / `in-progress` / `delayed` / `closed`)
- `startedAt` is set automatically when status changes to `in-progress`
- `completedAt` is set automatically when status changes to `closed`
- Phase badge displayed alongside status

**Date planning:**
- Start date picker
- End date picker
- Auto-computed duration shown (e.g., "3 weeks")

**Ownership & Team:**
- **Owner** — single `Person` from the org's people list; shown with a distinct owner badge; set via a searchable dialog
- **Linked People** — multiple team members from the org's people list; added/removed via a searchable multi-select dialog
- **Linked Vendors** — multiple vendors from the org's vendor list; added/removed via a searchable multi-select dialog
- **Assignee** — free-text field for a quick assignee name (independent of the People list)

**Acceptance Criteria:**
- List of criteria inherited from the deliverable template
- Each criterion can be checked/unchecked
- Completion records: `completedAt`, `completedBy`
- Checking a criterion creates an audit event

**RAID Linking:**
- View all RAID items linked to this deliverable
- Search and link existing RAID items from the project
- Create a new RAID item directly from the deliverable and automatically link it
- Inline edit of RAID item status and severity from this view

**Notes / Comments:**
- Add timestamped notes with author attribution
- Notify specific people from the org (select from people list)
- "Notify me" toggle

---

#### Evidence Tab

**Evidence upload dialog:**
- Evidence type selector: `document` / `image` / `link` / `sign-off`
- For file types: drag-and-drop zone or click-to-browse file picker
- For link type: URL input field
- Attach evidence to a specific evidence requirement or add it ad-hoc (not tied to a requirement)

**Email file parsing:**
- Drag a `.eml` or `.msg` email file onto the upload zone
- System parses the email and extracts sender information to create a linked `Person` record

**Evidence list:**
- Displays each uploaded item with: name, type, upload date, uploaded by
- Required vs optional indicator per evidence requirement
- **Verification:** each evidence item can be marked `verified` by a reviewer (records `verifiedAt`, `verifiedBy`)

---

#### Activity Tab

- Full chronological audit trail of every change to this deliverable
- Shows: event type icon, actor, description, timestamp

---

### 7.5 RAID Log

**Route:** `/projects/[id]/raid`  
**Purpose:** Manage all Risks, Assumptions, Issues, and Dependencies for a project

#### Summary Statistics Cards
- Count of open items by type (Risks / Assumptions / Issues / Dependencies)
- Count of items by severity (Critical / High / Medium / Low)
- Count of overdue items (past due date and not closed)

#### RAID Item Table
- Columns: type icon, title, severity badge, likelihood, status, owner, due date, created date
- Overdue indicator: red highlight when due date is in the past and item is not closed
- Inline editable: status, severity, likelihood (without opening a dialog)
- Click row to open full edit dialog

#### Filtering
- Text search: matches title and description
- Type filter: All / Risk / Assumption / Issue / Dependency
- Status filter: All / Open / In Progress / Closed
- Period filter (default: items updated within the last 30 days)

#### Sorting
- Sortable columns: type, title, severity, likelihood, status, owner, due date, created date

#### Pagination
- 15 items per page

#### Create RAID Item (dialog)
- Fields:
  - Type (required): Risk / Assumption / Issue / Dependency
  - Title (required)
  - Description
  - Severity (required): Low / Medium / High / Critical
  - Likelihood: Rare / Unlikely / Possible / Likely / Almost Certain
  - Status: Open / In Progress / Closed
  - Owner (text field)
  - Due date
  - Mitigation / Response plan
- Link to deliverables: multi-select searchable list of project deliverables

#### Edit RAID Item (dialog)
- All fields from create form, plus ability to change linked deliverables

---

### 7.6 Decision Log

**Route:** Within project tabs  
**Purpose:** Track key project decisions

#### Decision List
- Tabular view within the project
- Sortable by date, status

#### Create / Edit Decision (dialog)
- Fields:
  - Description (required): what was decided
  - Impact: the consequences of the decision
  - Date logged
  - Status: `pending` / `approved` / `rejected` / `deferred`
  - Comments / notes
  - Logged by (user name)

#### Delete Decision
- Confirmation dialog before deletion

#### Reporting integration
- Decision log data is automatically included in Executive Summary reports

---

### 7.7 Templates

**Routes:** `/templates` (list), `/templates/new` (create), `/templates/[id]` (view), `/templates/[id]/edit` (edit)  
**Purpose:** Create and manage reusable operational readiness program structures

#### Template Hierarchy
```
Template
  └── Focus Area (ordered)
        └── Sub-Section (ordered)
              └── Deliverable Template
                    ├── Acceptance Criteria (list)
                    ├── Evidence Requirements (list)
                    └── Dependencies (links to other Deliverable Templates)
```

#### Template Listing (`/templates`)
- Grid view with one card per template
- Each card shows: name, industry, version, count of focus areas, count of deliverables
- Actions per card: View, Edit, Clone, Delete

#### Template Viewer (`/templates/[id]`)
- Read-only hierarchical view of the template
- Tabs: Overview · Focus Areas · Deliverables
- Shows all nested content; suitable for reviewing before using in a project

#### Template Editor (`/templates/new` and `/templates/[id]/edit`)
- **Template-level fields:** name, description, version, industry

- **Focus Area management:**
  - Add / remove focus areas
  - Edit code and name
  - Reorder (drag or up/down controls)

- **Sub-Section management (within each focus area):**
  - Add / remove sub-sections
  - Edit code and name
  - Reorder

- **Deliverable Template management (within each sub-section):**
  - Add / remove deliverables
  - Edit: code, name, description, phase, domain, estimated duration
  - **Acceptance Criteria:** add / edit (description, verification method) / remove
  - **Evidence Requirements:** add / edit (name, type, description, required flag) / remove
  - **Dependencies:** link to other deliverable templates within the same template (multi-select)

#### Clone Template
- Creates a full independent copy of a template under a new name
- Useful for creating industry variants without affecting the original

#### Delete Template
- Confirmation dialog required
- Cannot delete a template that is in use by active projects (or warn the user)

---

### 7.8 Template Gallery

**Route:** `/template-gallery`  
**Access:** Public (no authentication required)  
**Purpose:** Showcase pre-built templates to attract new users; allow one-click adoption

#### Display
- Grid of template cards organized by industry
- Industries include: Mining & Resources, Legal & Fiduciary, Construction & Engineering, Healthcare, Aviation, Manufacturing
- Each card shows: title, industry, description, deliverable count, phases covered, optional badge (e.g., "Most Popular", "New")

#### Call to Action
- "Use Template" button on each card
- For unauthenticated users: redirects to registration
- For authenticated users: imports the template into their organization's template library

---

### 7.9 Stakeholders

**Route:** `/stakeholders`  
**Access:** All authenticated org members  
**Purpose:** Manage the people and companies involved in readiness activities

**Two tabs:** People · Vendors

---

#### People Tab (Team Members & Individuals)

**Fields:**
- Name (required)
- Type: `internal` / `contractor` / `consultant`
- Company (required)
- Role: `owner` / `team` / `end-user`
- Email (must be valid format)
- Phone
- Notes

**Actions:**
- Create person (dialog form)
- Edit person (dialog form, pre-filled)
- Delete person (confirmation dialog)

**List features:**
- Searchable by name, company, email
- Sortable columns
- Paginated

---

#### Vendors Tab (Companies & Suppliers)

**Fields:**
- Company name (required)
- Type: `supplier` / `service-provider`
- Contact name
- Contact role
- Email
- Phone
- Address
- Website
- Notes

**Actions:**
- Create vendor (dialog)
- Edit vendor (dialog, pre-filled)
- Delete vendor (confirmation dialog)

**List features:**
- Searchable by name, contact name, email
- Sortable columns
- Paginated

---

### 7.10 Analytics

**Route:** `/analytics`  
**Access:** All authenticated org members

#### Project Filter
- "All Projects" or a specific project

#### Tabs

**Readiness Tab**
- Overall readiness percentage across selected project(s)
- Breakdown by focus area: completion percentages
- Breakdown by phase: completion percentages

**Deliverables Tab**
- Total / completed / in-progress / delayed counts
- Bar chart: deliverables by status per focus area
- Pie chart: status distribution
- Trend over time: area or line chart of deliverable status history

**RAID Tab**
- Open RAID items by type (Risk / Assumption / Issue / Dependency) — pie/donut chart
- RAID items by severity — bar chart
- Overdue items count
- Trend of RAID item creation and closure over time

**Team Tab**
- People count by type (internal / contractor / consultant)
- Vendor count by type (supplier / service-provider)
- Activity counts from audit events (most active contributors)

---

### 7.11 Reports

**Routes:** `/reports` (list), `/reports/[id]` (view/edit), `/r/[token]` (public shared report)  
**Purpose:** Generate, publish, and share formal readiness reports

#### Report Types

| Type | Description |
|------|-------------|
| `detailed_activities` | Comprehensive breakdown of deliverables, RAID items, and activity movement |
| `executive_summary` | Slide-style summary for leadership: RAG status, Gantt, key activities, decisions, RAID |

#### Report List (`/reports`)
- Cards for each report showing: title, project, report type, status badge (draft / published), period, created date, view count (for published reports)
- Button to create a new report
- Published reports show a "Copy Link" button

#### Create Report
- Select report type (two-option toggle)
- Select project
- Enter title
- Set period start date and end date
- System generates initial section content as a snapshot of current project data

#### Report Editor (`/reports/[id]`)
- Sections rendered based on report type
- Each section has an **author narrative text area** for commentary/context
- Author can edit the narrative but the data snapshot is auto-generated
- **Publish:** Changes status from `draft` to `published`; generates a `shareToken` (UUID)
- **Copy share link:** Copies the public URL (`/r/[token]`) to clipboard
- **Delete:** Removes draft reports (confirmation required; published reports cannot be deleted while accessible)

#### Detailed Activities Report — Sections
1. **Deliverables Summary:** counts by status, breakdown table per focus area, focus area progress chart, phase progress chart
2. **RAID Summary:** totals, breakdown by type, summary of status changes during the period
3. **Activity Log:** list of audit events during the period

#### Executive Summary Report — Sections (slide format)
1. **RAG Status slide:** Per focus area: percentage complete, Red/Amber/Green color-coded status, top risks called out
2. **Schedule slide:** Gantt-style bar visualization: focus area bars with start and end dates
3. **Key Activities slide:** Lists of completed (Done), in-progress, and upcoming planned deliverables
4. **Decision Log slide:** All project decisions with date and status
5. **RAID Items slide:** Summary of open RAID items with severity indicators

#### Shared Report (`/r/[token]`)
- Publicly accessible — no authentication required
- Renders the report exactly as the editor view (read-only)
- Access is logged: `accessedAt`, `ipAddress`, `userAgent`, identifier of viewer if available
- View count is surfaced on the report card in the authenticated app

---

### 7.12 Settings

**Route:** `/settings`  
**Access:** `admin` and `owner` roles only  
**Purpose:** Configure organization-level settings

#### Tab: General
- Organization name
- Organization description
- Timezone selector
- Date format selector

#### Tab: Storage (Document Store)
- Provider selector: `local` / external provider (e.g., object storage service)
- For external providers: endpoint URL, access key, secret key, bucket/container name
- **Test connection** button to validate the configuration

#### Tab: Identity (SSO / IdP)
- Enable/disable identity provider
- Protocol: **SAML** or **OIDC**
- Preset selector: Custom / Azure Entra ID / Okta / Google Workspace
- Fields auto-populate based on preset:
  - SAML: Entity ID, SSO URL, X.509 Certificate (paste)
  - OIDC: Tenant ID, Client ID, Client Secret
- **Auto-provisioning** toggle: automatically create org member on first SSO login
- **Test connection** button

#### Tab: Email (SMTP)
- Provider: SMTP
- Fields: host, port, username, password, from email address, from display name, secure/TLS toggle
- **Test connection** button (sends a test email)

#### Tab: Notifications
- Email notifications on/off toggle
- Deliverable reminders on/off toggle (notify assignees of upcoming due dates)
- RAID alerts on/off toggle (notify relevant people of new RAID items)
- Weekly digest on/off toggle (summary email each week)

#### Tab: Users (Member Management)

**Members table:**
- Columns: name, email, role badge
- **Change role:** dropdown per member (except `owner`; cannot change owner's role)
- **Remove member:** button per member with confirmation dialog (cannot remove `owner`)

**Pending Invites table:**
- Columns: email, role, sent date, expiry date, status
- **Revoke invite:** cancels a pending invite

**Invite User dialog:**
- Email (required)
- Role selector: `admin` / `member` / `viewer`
- Optional: simultaneously create a stakeholder (Person) record:
  - Name, type (internal / contractor / consultant), role, company
- Sends an invite email to the provided address

---

### 7.13 Invite System

**Routes:** `/invite/[token]` (acceptance page), `/api/invite` (processing)

#### Invite Creation (from Settings)
- Admin creates an invite specifying email and role
- Invite can optionally be scoped to a specific project (for project-level access)
- A unique UUID token is generated
- An email is sent to the invitee containing a link to `/invite/[token]`
- Invite expires after a configurable period

#### Invite Acceptance (`/invite/[token]`)
- The page is publicly accessible (no prior login required)
- If the user has an existing account: they are prompted to log in and then auto-accepted
- If the user is new: they are prompted to create a password and complete registration
- On acceptance:
  - Invite status changes to `accepted`; `acceptedAt` timestamp recorded
  - User is added to the organization with the specified role
  - If project-scoped, user gains access to that project

#### Invite Management
- Pending invites visible in Settings > Users
- Admins can revoke pending invites (status changes to `revoked`)
- Expired invites (past `expiresAt`) are automatically treated as invalid

---

## 8. Navigation & Routing

### Authenticated Application — Primary Sidebar

| Item | Route |
|------|-------|
| Dashboard | `/` |
| Projects | `/projects` |
| Stakeholders | `/stakeholders` |
| Analytics | `/analytics` |
| Reports | `/reports` |
| Templates | `/templates` |
| Settings | `/settings` |

### Project-Level Sub-Navigation

| Tab | Route |
|-----|-------|
| Overview | `/projects/[id]` |
| Workspace | `/projects/[id]/workspace` |
| RAID | `/projects/[id]/raid` |
| Decisions | `/projects/[id]/decisions` |

### Public Routes (no authentication required)

| Route | Description |
|-------|-------------|
| `/landing` | Marketing landing page |
| `/use-cases` | Use case showcase |
| `/template-gallery` | Pre-built template showcase |
| `/login` | Login page |
| `/register` | Registration page |
| `/r/[token]` | Shared report viewer |
| `/invite/[token]` | Invite acceptance page |

### API Routes

| Route | Purpose |
|-------|---------|
| `/api/auth/[...nextauth]` | Authentication handler |
| `/api/auth/register` | New user registration |
| `/api/invite` | Invite acceptance processing |
| `/api/upload` | File upload for evidence attachments |
| `/api/user` | User profile updates |

---

## 9. Key Cross-Cutting Concerns

### Audit Trail
- Every significant action on a deliverable or RAID item creates an immutable `AuditEvent`
- Events stored with: event type, human-readable description, actor (user name), timestamp, and flexible metadata
- Events are surfaced in: the Dashboard activity feed, the deliverable detail Activity tab, and Reports

### File / Evidence Storage
- All uploaded files are stored via a configurable backend (local disk or cloud object storage)
- Files are referenced by URL in the `Evidence` table
- Upload is handled through a dedicated API endpoint
- The storage backend is configurable per-organization in Settings

### Email Notifications
- Triggered by: invite creation, deliverable note @-mentions, due date reminders, RAID alerts, weekly digest
- Sent via configured SMTP settings per organization
- All notification types can be toggled on/off per organization

### Responsiveness
- Application must be usable on desktop (primary) and tablet screen sizes
- Mobile view is supported with a collapsible sidebar

### Validation
- All form inputs validated on the client before submission
- Server-side validation applied to all API endpoints and server actions
- Zod schemas (or equivalent) define validation rules co-located with forms

### Error Handling
- User-facing error messages for failed operations (form errors, network failures)
- Toast notifications for success/failure of async operations

---

## 10. Build Sequence

The following sequence is recommended to build S-Planned progressively, validating each layer before adding complexity. Each phase produces a working, deployable product.

---

### Phase 1 — Foundation & Authentication

**Goal:** A working application shell that a user can register, log in to, and navigate.

1. Set up project structure, routing, and global layout (sidebar + page header)
2. Implement database schema for: `User`, `Organization`, `OrganizationMembership`
3. Build registration flow: create account → create personal organization → log in
4. Build login flow with email/password credentials
5. Implement server-managed session with role-aware authorization
6. Protect all application routes; redirect unauthenticated users to login
7. Build the authenticated app shell: sidebar navigation, user avatar, organization name display
8. Build the public marketing pages: `/landing`, `/use-cases`

**Exit criteria:** A user can register, log in, see the empty app shell, and log out.

---

### Phase 2 — Template Engine

**Goal:** Administrators can define reusable readiness program structures.

1. Extend schema: `Template`, `FocusArea`, `SubSection`, `DeliverableTemplate`, `AcceptanceCriteria`, `EvidenceRequirement`, `DeliverableTemplateDependency`
2. Build template listing page
3. Build template creation and editing UI:
   - Add/edit/remove focus areas with ordering
   - Add/edit/remove sub-sections within each focus area
   - Add/edit/remove deliverable templates within each sub-section
   - Add acceptance criteria per deliverable template
   - Add evidence requirements per deliverable template
4. Build template viewer (read-only hierarchical view)
5. Implement template clone operation
6. Implement template delete with safeguard (cannot delete if in use)
7. Build the public template gallery page

**Exit criteria:** Users can create, edit, clone, and delete templates. The gallery page is publicly visible.

---

### Phase 3 — Projects & Deliverables (Core Loop)

**Goal:** Users can create projects from templates and manage deliverable statuses.

1. Extend schema: `Project`, `DeliverableExecution`, `FocusArea` (execution context), `SubSection` (execution context)
2. Build project listing page with summary cards
3. Build create project wizard: select template → enter details → instantiate executions
4. Build project overview page: readiness %, stat cards, focus area progress chart, phase progress chart
5. Build project workspace in grouped accordion view (simplest view first)
6. Build deliverable detail page — Details tab:
   - Status management
   - Date planning
   - Assignee field
   - Inline title and description editing
7. Implement `AuditEvent` creation for all deliverable changes
8. Add flat table view to the workspace (with sorting, filtering, pagination)
9. Add Kanban board view with drag-and-drop
10. Implement bulk actions
11. Implement add custom deliverable

**Exit criteria:** A project can be created, deliverables can be updated, and progress is reflected in the overview.

---

### Phase 4 — RAID Log

**Goal:** Teams can track and manage risks, assumptions, issues, and dependencies.

1. Extend schema: `RAIDItem`, `RAIDItemDeliverable` (M:N link)
2. Build RAID log page: summary stat cards, filterable/sortable table, pagination
3. Build create RAID item dialog with all fields
4. Build edit RAID item dialog
5. Implement inline field editing (status, severity, likelihood from table row)
6. Implement RAID linking from deliverable detail (search + link; create + link)
7. Display linked RAID items on deliverable detail page
8. Add RAID summary widget to project overview page

**Exit criteria:** RAID items can be created, edited, and linked to deliverables. Project overview shows RAID summary.

---

### Phase 5 — Stakeholders & Team

**Goal:** Organizations can manage the people and vendors involved in readiness activities.

1. Extend schema: `Person`, `Vendor`, `DeliverableExecutionPerson` (M:N), `DeliverableExecutionVendor` (M:N)
2. Build stakeholders page with People and Vendors tabs
3. Build create/edit/delete dialogs for People and Vendors
4. Implement linking People to deliverables from the deliverable detail page
5. Implement linking Vendors to deliverables from the deliverable detail page
6. Implement setting the Owner (single person) on a deliverable
7. Display linked people and vendors on deliverable detail

**Exit criteria:** People and vendors can be managed and linked to specific deliverables.

---

### Phase 6 — Evidence & Acceptance Criteria

**Goal:** Teams can upload and verify evidence, and check off acceptance criteria.

1. Extend schema: `Evidence`, `EvidenceRequirement`, `CriteriaCompletion`
2. Build file upload API endpoint with configurable storage backend
3. Build evidence upload UI: drag-and-drop zone, type selector, link input
4. Implement email file parsing for `.eml` / `.msg` drag-and-drop
5. Build evidence list on the Evidence tab (with verification controls)
6. Implement evidence attachment to specific evidence requirements vs ad-hoc
7. Implement acceptance criteria list on the detail page (check/uncheck with audit)
8. Add evidence requirement display (required vs optional indicators)

**Exit criteria:** Evidence can be uploaded and verified; acceptance criteria can be checked off.

---

### Phase 7 — Notes, Activity & Decisions

**Goal:** Teams can add commentary, be notified, and log key decisions.

1. Extend schema: `DeliverableNote`, `Decision`
2. Build notes/comments section on the deliverable detail page
3. Implement @-notify: select people to notify via a note
4. Build the Activity tab on the deliverable detail page (full audit trail display)
5. Build the Decision Log tab within the project
6. Build create/edit/delete decision dialogs
7. Build the Dashboard activity feed with project/period filters

**Exit criteria:** Notes and decisions can be added. Activity feeds are populated and filterable.

---

### Phase 8 — Analytics

**Goal:** Users have visual, data-driven insights into readiness progress.

1. Build analytics page with project filter
2. Implement the Readiness tab: overall %, breakdown by focus area, breakdown by phase
3. Implement the Deliverables tab: status distribution charts, bar chart by focus area, trend over time
4. Implement the RAID tab: items by type and severity, overdue count, trend
5. Implement the Team tab: people by type, vendor by type, activity counts

**Exit criteria:** Analytics page renders accurate charts for all active projects.

---

### Phase 9 — Reports & Sharing

**Goal:** Formal reports can be generated, published, and shared publicly.

1. Extend schema: `Report`, `ReportSection`, `ReportAccess`
2. Build report listing page with report cards and view counts
3. Build report creation flow: select type, project, title, period
4. Implement auto-population of report sections from project snapshot data
5. Build report editor: author narrative text areas per section
6. Build the **Detailed Activities** report section renderers
7. Build the **Executive Summary** report section renderers (slide format)
8. Implement publish flow: status change + `shareToken` generation
9. Build the public shared report page (`/r/[token]`) — no auth required
10. Implement access logging for shared report views
11. Add copy-link UI in the report editor

**Exit criteria:** Reports can be created, populated, published, and shared via public link.

---

### Phase 10 — Settings & Administration

**Goal:** Administrators can fully configure the organization.

1. Extend schema: `OrganizationSettings`
2. Build settings page shell with all 6 tabs
3. Implement General settings (name, description, timezone, date format)
4. Implement Storage settings with test-connection functionality
5. Implement SMTP email settings with test-connection (sends test email)
6. Implement Notification preference toggles
7. Implement Users tab: member list, role change, remove member

**Exit criteria:** Organization settings are configurable by admins.

---

### Phase 11 — Invite System

**Goal:** Users can invite colleagues to the organization.

1. Extend schema: `Invite`
2. Build invite user dialog in Settings > Users (with optional person record creation)
3. Implement invite email sending via configured SMTP
4. Build invite acceptance page (`/invite/[token]`)
   - Handle existing account login flow
   - Handle new user registration flow
5. Add org membership on acceptance
6. Build pending invites table with revoke functionality

**Exit criteria:** Admins can invite users by email; invites are accepted and users are onboarded.

---

### Phase 12 — SSO / Identity Provider

**Goal:** Enterprise organizations can authenticate via their identity provider.

1. Extend `OrganizationSettings` with SSO/IdP fields
2. Build the Identity tab in Settings (protocol + preset + field configuration)
3. Implement SAML authentication flow
4. Implement OIDC authentication flow
5. Implement auto-provisioning on first SSO login
6. Build test-connection for SSO configuration

**Exit criteria:** Organizations can configure and use SAML or OIDC SSO.

---

### Phase 13 — Polish, Performance & Production Readiness

**Goal:** Application is production-ready, performant, and observable.

1. Add real-time or optimistic updates for common actions (status changes, notes)
2. Implement full-text search across deliverables and RAID items
3. Add pagination to all list endpoints
4. Implement rate limiting on all API endpoints
5. Add structured server-side logging and error tracking
6. Write end-to-end tests covering all critical user journeys
7. Build CI/CD pipeline: lint, type-check, test, deploy
8. Security hardening: review all server actions for authorization checks, input sanitization, file upload validation (type and size limits)
9. Environment variable management for all secrets and configuration
10. Add multi-organization switcher to the UI
11. Implement organization logo upload

**Exit criteria:** Application passes a security review, has full test coverage of critical paths, and deploys automatically on merge.

---

*End of PRD*
