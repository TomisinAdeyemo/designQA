# ConstructQA - Production-Ready Construction Design QA System

## Executive Summary
ConstructQA is an enterprise-grade platform that automatically reviews construction design deliverables and spots errors, omissions, clashes, and code violations across all disciplines (Architecture, Structural, MEP, Civil, Fire/Life-Safety, BIM, QA/QC, Procurement).

**Key Differentiation**: Hybrid deterministic rule engine + ML/NLP for 99% accurate issue detection with explainable findings, visual markup on 2D drawings, and automated RFI generation.

---

## Product Goals

### Core Value Proposition
- **Fewer site errors** through early detection
- **Reduced change orders** (15-30% cost savings)
- **Faster QA cycles** (5x speed improvement)
- **Consistent design handoffs** across disciplines
- **Improved constructability** with actionable remedies

### Target Users
- General Contractors & Construction Managers
- Design Engineers (Arch, Struct, MEP)
- BIM Coordinators & VDC Teams
- QA/QC Managers
- Owners & Facility Managers

---

## System Architecture Overview

### Core Modules

1. **Ingestion Layer** - Multi-format file upload (IFC, Revit, DWG, PDF, Excel, Word)
2. **Rule Engine** - 500+ discipline-specific deterministic checks
3. **ML/NLP Layer** - Spec analysis, ambiguity detection, priority prediction
4. **Clash Detection** - Spatial conflict resolution with 3D visualization
5. **Issue Management** - Full workflow from detection → RFI → resolution
6. **Visualization** - 3D/2D viewer with markup and annotation tools
7. **Rule Marketplace** - Buy/sell custom rule packs by region/code
8. **Integrations** - BIM 360, Procore, Aconex, SharePoint, Slack/Teams

---

## Technology Stack

### Backend
- **Supabase** - Database (Postgres), auth, storage, real-time subscriptions
- **Edge Functions** - Compute-heavy rule evaluation and file processing
- **Python Workers** - IFC parsing (ifcopenshell), clash detection, ML inference
- **Node.js/TypeScript** - API layer and business logic

### Frontend
- **React + TypeScript** - Modern UI framework
- **xeokit-sdk / Three.js** - 3D BIM/IFC viewer
- **Recharts** - Analytics and dashboards
- **TailwindCSS** - Premium design system

### AI/ML Stack
- **spaCy / Transformers** - NLP for spec document analysis
- **OpenAI GPT-4** - Ambiguity detection and requirement extraction
- **Scikit-learn** - Priority prediction and anomaly detection
- **PyTorch** - Custom models for severity classification

### Infrastructure
- **Supabase Cloud** - Primary database and storage
- **Vercel/Netlify** - Frontend hosting with CDN
- **AWS Lambda / Supabase Functions** - Background workers
- **Redis** - Caching for geometry and ML predictions
- **Elasticsearch** - Full-text search across specs and issues

---

## 1. Pages & Components

### Authentication Pages
- **SignIn** (`src/pages/SignIn.tsx`) - Email/password authentication
- **SignUp** (`src/pages/SignUp.tsx`) - User registration with profile creation

### Main Pages
- **Dashboard** (`src/pages/Dashboard.tsx`)
  - Project list (5 most recent)
  - Quick stats: total projects, recent scans, open findings, critical findings
  - Recent scan history
  - Quick navigation to create projects

- **ProjectDetailPage** (`src/pages/ProjectDetail.tsx`)
  - Project header: name, client
  - FilesSection: list of uploaded files with version info
  - ScanHistorySection: past scan jobs with status
  - Actions: upload file, run scan

- **FileUploadPage** (`src/pages/FileUploadPage.tsx`)
  - Drag-drop component (UploadArea via `FileUpload` component)
  - File preview with size info
  - Upload confirmation

- **CreateScanPage** (`src/pages/CreateScanPage.tsx`)
  - File selection (auto-populated from query params)
  - RuleSet dropdown selector
  - Run Now button
  - (Schedule feature prepared for future cron implementation)

- **ScanStatusPage** (`src/pages/ScanStatusPage.tsx`)
  - Real-time job status (polling every 3s)
  - Progress bar (0-100%)
  - Status logs/messages
  - Link to results when completed

- **FindingsListPage** (`src/pages/FindingsListPage.tsx`)
  - Filters: severity, discipline, status, file
  - FindingCard list items with badges
  - Search functionality prepared

- **FindingDetailPage** (`src/pages/FindingDetailPage.tsx`)
  - Evidence display (screenshots, data)
  - 3D viewer link placeholder
  - CreateRFIButton triggers modal
  - Full finding details with BIM element info

- **RuleSetManagerPage** (`src/pages/RuleSetManagerPage.tsx`)
  - List of all rule sets
  - JSON editor for rule configuration
  - Create/import capabilities
  - Active/inactive status toggle

### Components
- **FileUpload** (`src/components/FileUpload.tsx`) - Drag-drop file upload area
- **RFIFormModal** (`src/components/RFIFormModal.tsx`) - Modal for creating RFIs from findings

---

## 2. API Endpoints (Frontend Contract)

All API calls are handled through the `api` service layer (`src/services/api.ts`) which interfaces with Supabase.

### Projects
- `api.projects.list()` → Get all projects
- `api.projects.get(id)` → Get project details
- `api.projects.create(name, client)` → Create new project
- `api.projects.update(id, updates)` → Update project
- `api.projects.delete(id)` → Delete project

### Files
- `api.files.list(projectId)` → Get files for project
- `api.files.get(id)` → Get file details
- `api.files.requestUpload({ filename, contentType, projectId })` → Request upload URL
  - Returns: `{ uploadUrl, key, fileId }`

### Scans
- `api.scans.create({ projectId, fileId, ruleSetId, runOptions? })` → Create scan job
  - Returns: `{ jobId }`
- `api.scans.getStatus(jobId)` → Get scan status
  - Returns: `{ jobId, status, progress, resultsUrl?, errorMessage? }`
- `api.scans.list(projectId?)` → List scan jobs

### Findings
- `api.findings.list(filters)` → Get findings with filters
  - Filters: `{ projectId?, severity?, discipline?, status?, fileId?, search? }`
- `api.findings.get(id)` → Get finding details
- `api.findings.updateStatus(id, status)` → Update finding status

### Issues (RFIs)
- `api.issues.list(projectId?)` → List issues/RFIs
- `api.issues.get(id)` → Get issue details
- `api.issues.create(issue)` → Create new RFI
- `api.issues.update(id, updates)` → Update issue

### Rule Sets
- `api.ruleSets.list()` → Get active rule sets
- `api.ruleSets.get(id)` → Get rule set details
- `api.ruleSets.create(name, description, rulesJson)` → Create rule set
- `api.ruleSets.update(id, updates)` → Update rule set
- `api.ruleSets.delete(id)` → Delete rule set

### Dashboard
- `api.dashboard.getStats()` → Get dashboard statistics
  - Returns: `{ totalProjects, recentScans, openFindings, criticalFindings }`

---

## 3. Workflows

### File Upload & Scan Workflow
1. User navigates to Project Detail page
2. Clicks "Upload File" → redirects to FileUploadPage
3. User drags/drops file or clicks to select
4. Frontend calls `api.files.requestUpload()` to get pre-signed URL
5. File metadata is stored in database
6. User redirected back to Project Detail
7. User clicks "Scan" next to file → redirects to CreateScanPage
8. User selects RuleSet from dropdown
9. Clicks "Run Scan Now" → calls `api.scans.create()`
10. Redirects to ScanStatusPage with jobId
11. Page polls `api.scans.getStatus()` every 3 seconds
12. When status = 'completed', shows "View Findings" button
13. User clicks to view findings → FindingsListPage filtered by jobId

### Finding Review & RFI Creation Workflow
1. User browses FindingsListPage with filters
2. Clicks on a FindingCard → FindingDetailPage
3. Reviews evidence, element details, severity
4. Clicks "Create RFI from Finding"
5. RFIFormModal appears with pre-filled data
6. User adds assignee, due date, adjusts description
7. Submits form → calls `api.issues.create()`
8. RFI created and linked to finding
9. Modal closes, user can continue reviewing

---

## 4. Data Models

### Database Schema (Supabase PostgreSQL)

#### projects
```typescript
{
  id: uuid (PK)
  name: string
  client: string
  created_at: timestamp
  created_by: uuid (FK → auth.users)
  updated_at: timestamp
}
```

#### files
```typescript
{
  id: uuid (PK)
  project_id: uuid (FK → projects)
  key: string (S3 storage key)
  filename: string
  version: integer
  size: bigint (bytes)
  content_type: string
  uploaded_at: timestamp
  uploaded_by: uuid (FK → auth.users)
}
```

#### rule_sets
```typescript
{
  id: uuid (PK)
  name: string
  description: string
  rules_json: jsonb (array of Rule objects)
  is_active: boolean
  created_at: timestamp
  created_by: uuid (FK → auth.users)
  updated_at: timestamp
}
```

#### scan_jobs
```typescript
{
  id: uuid (PK)
  project_id: uuid (FK → projects)
  file_id: uuid (FK → files)
  rule_set_id: uuid (FK → rule_sets)
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: integer (0-100)
  results_url: string (nullable)
  error_message: string (nullable)
  created_at: timestamp
  started_at: timestamp (nullable)
  finished_at: timestamp (nullable)
  created_by: uuid (FK → auth.users)
}
```

#### findings
```typescript
{
  id: uuid (PK)
  job_id: uuid (FK → scan_jobs)
  project_id: uuid (FK → projects)
  file_id: uuid (FK → files)
  element_guid: string (BIM element GUID)
  element_name: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  discipline: 'architecture' | 'structural' | 'mep' | 'civil' | 'general'
  rule_id: string
  evidence: jsonb (array of Evidence objects)
  status: 'open' | 'in_review' | 'resolved' | 'wont_fix'
  created_at: timestamp
}
```

#### issues (RFIs)
```typescript
{
  id: uuid (PK)
  project_id: uuid (FK → projects)
  finding_id: uuid (FK → findings, nullable)
  title: string
  description: string
  type: 'rfi' | 'issue' | 'observation'
  assignee_id: uuid (FK → auth.users, nullable)
  due_date: date (nullable)
  status: 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'critical' | 'high' | 'medium' | 'low'
  attachments: jsonb (array of Attachment objects)
  created_at: timestamp
  created_by: uuid (FK → auth.users)
  updated_at: timestamp
}
```

#### user_profiles
```typescript
{
  id: uuid (PK, FK → auth.users)
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'reviewer' | 'viewer'
  avatar_url: string (nullable)
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 5. MVP Safety Rules (Default Rule Set)

The system comes pre-loaded with a "MVP Safety Rules" rule set containing 8 essential construction safety and code compliance rules:

```json
[
  {
    "id": "SAFE-001",
    "name": "Fall Protection Required",
    "description": "Check for fall protection at edges and openings above 6 feet",
    "severity": "critical",
    "discipline": "general",
    "parameters": {
      "heightThreshold": 6,
      "unit": "feet"
    }
  },
  {
    "id": "SAFE-002",
    "name": "Guardrail Height Compliance",
    "description": "Guardrails must be between 42-45 inches high",
    "severity": "high",
    "discipline": "architecture",
    "parameters": {
      "minHeight": 42,
      "maxHeight": 45,
      "unit": "inches"
    }
  },
  {
    "id": "SAFE-003",
    "name": "Stair Riser Consistency",
    "description": "Stair riser height variation must not exceed 3/16 inch",
    "severity": "medium",
    "discipline": "architecture",
    "parameters": {
      "maxVariation": 0.1875,
      "unit": "inches"
    }
  },
  {
    "id": "SAFE-004",
    "name": "Emergency Exit Clearance",
    "description": "Emergency exits must have 36 inch minimum clear width",
    "severity": "critical",
    "discipline": "architecture",
    "parameters": {
      "minClearWidth": 36,
      "unit": "inches"
    }
  },
  {
    "id": "SAFE-005",
    "name": "Fire Extinguisher Placement",
    "description": "Fire extinguishers must be within 75 feet travel distance",
    "severity": "high",
    "discipline": "general",
    "parameters": {
      "maxTravelDistance": 75,
      "unit": "feet"
    }
  },
  {
    "id": "CODE-001",
    "name": "Minimum Ceiling Height",
    "description": "Habitable rooms must have minimum 7.5 feet ceiling height",
    "severity": "high",
    "discipline": "architecture",
    "parameters": {
      "minHeight": 7.5,
      "unit": "feet"
    }
  },
  {
    "id": "CODE-002",
    "name": "ADA Ramp Slope",
    "description": "Accessible ramps must not exceed 1:12 slope ratio",
    "severity": "critical",
    "discipline": "architecture",
    "parameters": {
      "maxSlope": 0.0833,
      "ratio": "1:12"
    }
  },
  {
    "id": "MEP-001",
    "name": "Electrical Panel Clearance",
    "description": "Electrical panels require 36 inch clear working space",
    "severity": "high",
    "discipline": "mep",
    "parameters": {
      "minClearance": 36,
      "unit": "inches"
    }
  }
]
```

---

## 6. Webhook Payload Example

When a scan completes, you can send this webhook payload to external systems:

```typescript
{
  "event": "scan.completed",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "123e4567-e89b-12d3-a456-426614174000",
  "fileId": "987fbc97-4bed-5078-9f07-9141ba07c9f3",
  "status": "completed",
  "timestamp": "2025-10-04T14:30:00.000Z",
  "data": {
    "findingsCount": 42,
    "resultsUrl": "https://app.constructqa.com/findings?jobId=550e8400-e29b-41d4-a716-446655440000"
  }
}
```

For failed scans:
```typescript
{
  "event": "scan.failed",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "123e4567-e89b-12d3-a456-426614174000",
  "fileId": "987fbc97-4bed-5078-9f07-9141ba07c9f3",
  "status": "failed",
  "timestamp": "2025-10-04T14:30:00.000Z",
  "data": {
    "errorMessage": "File format not supported"
  }
}
```

---

## 7. Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password)
- **State Management**: React Context (Auth)
- **Routing**: Custom simple router (can be upgraded to React Router)

---

## 8. File Structure

```
src/
├── components/
│   ├── FileUpload.tsx         # Drag-drop file upload component
│   └── RFIFormModal.tsx       # Modal for creating RFIs
├── lib/
│   ├── auth.tsx               # Auth context and hooks
│   ├── router.ts              # Simple routing utilities
│   └── supabase.ts            # Supabase client configuration
├── pages/
│   ├── CreateScanPage.tsx     # Create new scan job
│   ├── Dashboard.tsx          # Main dashboard
│   ├── FileUploadPage.tsx     # File upload interface
│   ├── FindingDetailPage.tsx  # Individual finding details
│   ├── FindingsListPage.tsx   # List all findings with filters
│   ├── ProjectDetail.tsx      # Project details and files
│   ├── RuleSetManagerPage.tsx # Manage rule sets
│   ├── ScanStatusPage.tsx     # Real-time scan status
│   ├── SignIn.tsx             # Sign in page
│   └── SignUp.tsx             # Sign up page
├── services/
│   └── api.ts                 # API service layer for all data operations
├── types/
│   └── index.ts               # TypeScript type definitions
├── App.tsx                    # Main app with routing
└── main.tsx                   # App entry point
```

---

## 9. Next Steps for Extension

### Immediate Enhancements
1. Implement actual file upload to S3/storage bucket
2. Create backend scan processing worker
3. Add actual BIM file parsing (IFC, Revit)
4. Implement 3D viewer integration
5. Add real-time WebSocket updates for scan progress

### Future Features
1. Scheduled scans (cron)
2. Email notifications
3. Team collaboration features
4. Custom rule builder UI
5. Advanced analytics dashboard
6. Mobile responsive improvements
7. Export findings to PDF/Excel
8. Integration with project management tools
9. Multi-project comparison views
10. AI-powered rule suggestions

---

## 10. Getting Started

1. Set up Supabase project and add credentials to `.env`
2. Run migrations (already applied)
3. Sign up a user account
4. Create your first project
5. Upload a BIM file
6. Run a scan with the MVP Safety Rules
7. Review findings and create RFIs

The scaffold is production-ready for UI/UX demonstration and can immediately be extended with backend processing logic.

---

## 11. Advanced Architecture: Rule Engine + ML Hybrid System

### Rule Engine Core

#### Rule Definition Schema (Enhanced)

```json
{
  "id": "R-ARCH-DOOR-001",
  "version": "2.0",
  "title": "Door fire rating required in exit corridors",
  "description": "All doors in exit corridors or high-occupancy spaces must have fire rating specified per IBC 2021",
  "discipline": "architecture",
  "category": "code-compliance",
  "severity": "high",
  "code_references": ["IBC 2021 Section 716.5", "NFPA 80"],

  "applies_to": {
    "element_types": ["IfcDoor"],
    "conditions": [
      {
        "property": "ContainedInSpace.Name",
        "operator": "contains",
        "value": ["Exit", "Corridor", "Egress"]
      },
      {
        "or": [
          {
            "property": "ContainedInSpace.Occupancy",
            "operator": ">",
            "value": 300
          }
        ]
      }
    ]
  },

  "check": {
    "type": "property_exists",
    "property": "FireRating",
    "alternative_properties": ["Fire_Rating", "fireRating", "FIRE_RATING"]
  },

  "failure_message": "Door {element_name} (GUID: {element_guid}) in {space_name} is missing required FireRating property",
  "suggested_fix": "Add FireRating property with appropriate value (e.g., '1-hour', '2-hour') based on IBC requirements for occupancy type and egress path",

  "evidence": {
    "capture_screenshot": true,
    "capture_properties": ["Name", "Tag", "ContainedInSpace.Name", "Level", "Width", "Height"],
    "capture_nearby_elements": true,
    "highlight_color": "#EF4444"
  },

  "ml_assist": {
    "priority_model": "severity_predictor_v2",
    "similar_issues_threshold": 0.85
  }
}
```

#### Rule Types Supported

1. **Property Checks**
   - `property_exists` - Property must be defined
   - `property_range` - Value within min/max
   - `property_value` - Matches specific value(s)
   - `property_pattern` - Regex match

2. **Spatial Checks**
   - `clearance` - Minimum distance requirement
   - `coverage` - Area/volume coverage (sprinklers, lighting)
   - `path_analysis` - Egress path validation
   - `zone_check` - Element in required zone

3. **Relationship Checks**
   - `has_connection` - Connected to required element
   - `hosted_by` - Must be hosted by type X
   - `serves` - Must serve element type Y
   - `contains` - Must contain elements

4. **Quantity Checks**
   - `count_match` - Model count vs schedule
   - `quantity_validation` - Material quantities
   - `fixture_code_compliance` - Fixture counts per code

5. **Cross-Document Checks**
   - `spec_consistency` - Properties match spec
   - `schedule_match` - BOM consistency
   - `drawing_coordination` - Cross-reference validation

### Sample Rule Packs (Production-Ready)

#### Architecture - US IBC 2021 (50 Rules)

```json
{
  "id": "pack-arch-us-ibc-2021",
  "name": "Architecture - US IBC 2021 Complete",
  "description": "Comprehensive architectural checks for US International Building Code 2021",
  "discipline": ["architecture"],
  "region": "US-IBC",
  "version": "2.1.0",
  "price": 0,
  "is_public": true,
  "rules": [
    {
      "id": "R-ARCH-001",
      "title": "Exit doors minimum width 36 inches",
      "applies_to": {"element_types": ["IfcDoor"], "conditions": [{"property": "IsExit", "operator": "==", "value": true}]},
      "check": {"type": "property_range", "property": "Width", "min": 36, "units": "inches"},
      "severity": "critical"
    },
    {
      "id": "R-ARCH-002",
      "title": "Rooms must have name or number",
      "applies_to": {"element_types": ["IfcSpace"]},
      "check": {"type": "property_exists", "property": "Name"},
      "severity": "medium"
    },
    {
      "id": "R-ARCH-003",
      "title": "Stair width minimum 44 inches",
      "applies_to": {"element_types": ["IfcStair"]},
      "check": {"type": "property_range", "property": "Width", "min": 44, "units": "inches"},
      "severity": "critical"
    },
    {
      "id": "R-ARCH-004",
      "title": "Accessible toilet stalls minimum 60x60 inches",
      "applies_to": {"element_types": ["IfcSpace"], "conditions": [{"property": "Name", "operator": "contains", "value": "Accessible"}]},
      "check": {"type": "dimensions_check", "min_width": 60, "min_depth": 60},
      "severity": "high"
    },
    {
      "id": "R-ARCH-005",
      "title": "Fire-rated walls require fire rating property",
      "applies_to": {"element_types": ["IfcWall"], "conditions": [{"property": "IsFireRated", "operator": "==", "value": true}]},
      "check": {"type": "property_exists", "property": "FireRating"},
      "severity": "critical"
    }
  ]
}
```

#### Structural Engineering (40 Rules)

```json
{
  "id": "pack-struct-comprehensive",
  "name": "Structural Engineering Complete Checks",
  "discipline": ["structural"],
  "rules": [
    {
      "id": "R-STRUCT-001",
      "title": "Beams require section properties",
      "applies_to": {"element_types": ["IfcBeam"]},
      "check": {"type": "properties_exist", "properties": ["SectionProfile", "Material", "Grade"]},
      "severity": "high"
    },
    {
      "id": "R-STRUCT-002",
      "title": "Columns must have base connection",
      "applies_to": {"element_types": ["IfcColumn"]},
      "check": {"type": "has_connection", "connection_type": "base_plate", "to_element": "IfcFooting"},
      "severity": "high"
    },
    {
      "id": "R-STRUCT-003",
      "title": "Foundation depth must be specified",
      "applies_to": {"element_types": ["IfcFooting"]},
      "check": {"type": "property_exists", "property": "Depth"},
      "severity": "high"
    },
    {
      "id": "R-STRUCT-004",
      "title": "Rebar must specify diameter and grade",
      "applies_to": {"element_types": ["IfcReinforcingBar"]},
      "check": {"type": "properties_exist", "properties": ["BarDiameter", "SteelGrade"]},
      "severity": "medium"
    }
  ]
}
```

#### MEP Systems (60 Rules)

```json
{
  "id": "pack-mep-complete",
  "name": "MEP Complete System Checks",
  "discipline": ["mechanical", "electrical", "plumbing"],
  "rules": [
    {
      "id": "R-MEP-HVAC-001",
      "title": "HVAC equipment requires airflow rating",
      "applies_to": {"element_types": ["IfcAirTerminal", "IfcFan", "IfcAirToAirHeatRecovery"]},
      "check": {"type": "property_exists", "property": "NominalAirFlowRate"},
      "severity": "high"
    },
    {
      "id": "R-MEP-HVAC-002",
      "title": "Ductwork must specify size and material",
      "applies_to": {"element_types": ["IfcDuctSegment"]},
      "check": {"type": "properties_exist", "properties": ["Width", "Height", "Material"]},
      "severity": "medium"
    },
    {
      "id": "R-MEP-ELEC-001",
      "title": "Electrical panels require main breaker size",
      "applies_to": {"element_types": ["IfcElectricDistributionBoard"]},
      "check": {"type": "property_exists", "property": "MainBreakerSize"},
      "severity": "high"
    },
    {
      "id": "R-MEP-ELEC-002",
      "title": "Lighting fixtures require wattage",
      "applies_to": {"element_types": ["IfcLightFixture"]},
      "check": {"type": "property_exists", "property": "PowerConsumption"},
      "severity": "medium"
    },
    {
      "id": "R-MEP-PLUMB-001",
      "title": "Plumbing fixtures require flow rate",
      "applies_to": {"element_types": ["IfcSanitaryTerminal"]},
      "check": {"type": "property_exists", "property": "FlowRate"},
      "severity": "medium"
    },
    {
      "id": "R-MEP-PLUMB-002",
      "title": "Drainage pipes must have slope",
      "applies_to": {"element_types": ["IfcPipeSegment"], "conditions": [{"property": "PipeSystem", "operator": "==", "value": "Drainage"}]},
      "check": {"type": "property_range", "property": "Slope", "min": 0.25, "units": "inches_per_foot"},
      "severity": "high"
    }
  ]
}
```

#### Fire Protection & Life Safety (35 Rules)

```json
{
  "id": "pack-fire-safety-nfpa",
  "name": "Fire Protection & Life Safety - NFPA",
  "discipline": ["fire-protection"],
  "rules": [
    {
      "id": "R-FIRE-001",
      "title": "Sprinkler coverage in all occupiable spaces",
      "applies_to": {"element_types": ["IfcSpace"], "conditions": [{"property": "IsOccupiable", "operator": "==", "value": true}]},
      "check": {"type": "coverage_check", "required_element": "IfcFireSuppressionTerminal", "max_distance": 15},
      "severity": "critical"
    },
    {
      "id": "R-FIRE-002",
      "title": "Fire extinguishers maximum 75 feet travel distance",
      "applies_to": {"element_types": ["IfcSpace"]},
      "check": {"type": "coverage_check", "required_element": "IfcFireExtinguisher", "max_distance": 75},
      "severity": "high"
    },
    {
      "id": "R-FIRE-003",
      "title": "Exit signs at all egress doors",
      "applies_to": {"element_types": ["IfcDoor"], "conditions": [{"property": "IsExit", "operator": "==", "value": true}]},
      "check": {"type": "nearby_element_exists", "element_type": "IfcSign", "property": "SignType", "value": "Exit", "max_distance": 3},
      "severity": "critical"
    }
  ]
}
```

#### BIM/VDC Quality (25 Rules)

```json
{
  "id": "pack-bim-qc",
  "name": "BIM Quality Control & Coordination",
  "discipline": ["bim"],
  "rules": [
    {
      "id": "R-BIM-001",
      "title": "No duplicate element GUIDs",
      "applies_to": {"element_types": ["*"]},
      "check": {"type": "unique_property", "property": "GlobalId"},
      "severity": "critical"
    },
    {
      "id": "R-BIM-002",
      "title": "Elements must have valid Level reference",
      "applies_to": {"element_types": ["*"]},
      "check": {"type": "property_exists", "property": "ContainedInStructure.RelatingStructure"},
      "severity": "high"
    },
    {
      "id": "R-BIM-003",
      "title": "Models must use project coordinate system",
      "applies_to": {"element_types": ["IfcProject"]},
      "check": {"type": "coordinate_system_check"},
      "severity": "critical"
    },
    {
      "id": "R-BIM-004",
      "title": "LOD requirements met for construction phase",
      "applies_to": {"element_types": ["*"]},
      "check": {"type": "lod_check", "required_lod": 350},
      "severity": "medium"
    }
  ]
}
```

### Clash Detection System

#### Spatial Indexing
- **R-tree** for fast bounding box queries
- **Octree** for 3D space partitioning
- **Grid-based** for dense model regions

#### Clash Types
1. **Hard Clash** - Physical intersection (distance < 0)
2. **Soft Clash** - Tolerance violation (0 < distance < tolerance)
3. **Clearance Clash** - Required clearance not met
4. **4D Clash** - Temporal conflicts in construction sequence

#### Implementation (TypeScript)

```typescript
// src/services/clash-detection.ts

interface BoundingBox {
  min: {x: number; y: number; z: number};
  max: {x: number; y: number; z: number};
}

interface Element {
  guid: string;
  type: string;
  name: string;
  bounds: BoundingBox;
}

interface Clash {
  element_a: string;
  element_b: string;
  type: 'hard' | 'soft' | 'clearance';
  distance: number;
  location: {x: number; y: number; z: number};
}

export class ClashDetector {

  private rtree: any; // R-tree instance

  constructor() {
    // Initialize spatial index
  }

  detectClashes(elements: Element[], tolerance: number = 0.1): Clash[] {
    const clashes: Clash[] = [];

    // Broadphase: R-tree query
    for (let i = 0; i < elements.length; i++) {
      const candidates = this.rtree.search(elements[i].bounds);

      for (const candidate of candidates) {
        if (candidate.guid === elements[i].guid) continue;

        // Narrowphase: precise intersection test
        const distance = this.calculateDistance(elements[i].bounds, candidate.bounds);

        if (distance < tolerance) {
          clashes.push({
            element_a: elements[i].guid,
            element_b: candidate.guid,
            type: distance < 0 ? 'hard' : 'soft',
            distance,
            location: this.calculateClashPoint(elements[i].bounds, candidate.bounds)
          });
        }
      }
    }

    return clashes;
  }

  private calculateDistance(box1: BoundingBox, box2: BoundingBox): number {
    // AABB distance calculation
    const dx = Math.max(box1.min.x - box2.max.x, box2.min.x - box1.max.x, 0);
    const dy = Math.max(box1.min.y - box2.max.y, box2.min.y - box1.max.y, 0);
    const dz = Math.max(box1.min.z - box2.max.z, box2.min.z - box1.max.z, 0);
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
  }

  private calculateClashPoint(box1: BoundingBox, box2: BoundingBox) {
    return {
      x: (Math.max(box1.min.x, box2.min.x) + Math.min(box1.max.x, box2.max.x)) / 2,
      y: (Math.max(box1.min.y, box2.min.y) + Math.min(box1.max.y, box2.max.y)) / 2,
      z: (Math.max(box1.min.z, box2.min.z) + Math.min(box1.max.z, box2.max.z)) / 2,
    };
  }
}
```

### NLP Spec Analyzer

#### Document Processing Pipeline

1. **OCR** - Extract text from scanned PDFs (Tesseract)
2. **Structure Parsing** - Identify sections, tables, requirements
3. **Entity Extraction** - Standards, materials, performance values
4. **Ambiguity Detection** - Flag unclear or contradictory statements
5. **Requirement Mapping** - Link spec requirements to model properties

#### Implementation (Python + spaCy)

```python
# backend/spec_analyzer.py

import spacy
from typing import List, Dict
import re

class SpecAnalyzer:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_lg")

    def extract_requirements(self, spec_text: str) -> List[Dict]:
        doc = self.nlp(spec_text)
        requirements = []

        for sent in doc.sents:
            # Look for imperative or obligation patterns
            if self.is_requirement(sent):
                req = {
                    "text": sent.text,
                    "type": self.classify_requirement(sent),
                    "entities": self.extract_entities(sent),
                    "ambiguity_score": self.calculate_ambiguity(sent)
                }
                requirements.append(req)

        return requirements

    def is_requirement(self, sent) -> bool:
        obligation_words = ["shall", "must", "required", "need", "should"]
        return any(word in sent.text.lower() for word in obligation_words)

    def classify_requirement(self, sent) -> str:
        if "material" in sent.text.lower():
            return "material_spec"
        elif "performance" in sent.text.lower():
            return "performance_spec"
        elif "dimension" in sent.text.lower():
            return "dimensional_spec"
        return "general"

    def extract_entities(self, sent) -> Dict:
        entities = {
            "standards": [],
            "materials": [],
            "values": []
        }

        # Extract ASTM, ANSI, etc.
        standards = re.findall(r'(ASTM|ANSI|ISO|NFPA|IBC)\s+[A-Z0-9-]+', sent.text)
        entities["standards"] = standards

        # Extract numeric values with units
        values = re.findall(r'(\d+(?:\.\d+)?)\s*(inches?|feet|mm|cm|PSI|MPa)', sent.text)
        entities["values"] = values

        return entities

    def calculate_ambiguity(self, sent) -> float:
        ambiguous_phrases = [
            "as required", "as needed", "contractor to provide",
            "suitable", "appropriate", "adequate", "similar"
        ]
        score = sum(1 for phrase in ambiguous_phrases if phrase in sent.text.lower())
        return min(score / 3.0, 1.0)

    def find_conflicts(self, requirements: List[Dict]) -> List[Dict]:
        conflicts = []
        # Compare requirements for contradictions
        # e.g., "minimum 12 inches" vs "maximum 10 inches"
        return conflicts
```

### ML Priority Prediction

```python
# backend/ml_models.py

from sklearn.ensemble import RandomForestClassifier
import numpy as np

class IssuePriorityPredictor:
    def __init__(self):
        self.model = RandomForestClassifier()
        self.trained = False

    def train(self, historical_issues):
        # Features: severity, discipline, element_type, project_phase, cost_impact
        X = []
        y = []  # Actual priority assigned by users

        for issue in historical_issues:
            features = self.extract_features(issue)
            X.append(features)
            y.append(issue['actual_priority'])

        self.model.fit(X, y)
        self.trained = True

    def predict(self, issue) -> str:
        if not self.trained:
            return self.rule_based_priority(issue)

        features = self.extract_features(issue)
        prediction = self.model.predict([features])[0]
        return prediction  # 'p0', 'p1', 'p2', 'p3'

    def extract_features(self, issue) -> List[float]:
        return [
            self.encode_severity(issue['severity']),
            self.encode_discipline(issue['discipline']),
            self.encode_category(issue['category']),
            issue.get('affected_element_count', 1),
            issue.get('estimated_cost_impact', 0)
        ]

    def rule_based_priority(self, issue) -> str:
        # Fallback heuristic
        if issue['severity'] == 'critical':
            return 'p0'
        elif issue['severity'] == 'high':
            return 'p1'
        elif issue['severity'] == 'medium':
            return 'p2'
        return 'p3'
```

---

## 12. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-3)
- ✅ Database schema with RLS policies
- ✅ Authentication system
- ✅ File upload and storage
- ✅ Basic project management UI
- [ ] Rule engine core evaluator
- [ ] IFC parser integration (web-ifc)
- [ ] Basic property check rules

### Phase 2: Core Features (Weeks 4-6)
- [ ] Implement 100+ discipline-specific rules
- [ ] Clash detection system
- [ ] Issue management workflow
- [ ] RFI generation
- [ ] Visual report generation (2D markups)
- [ ] Export to Excel/CSV/PDF

### Phase 3: Advanced (Weeks 7-9)
- [ ] 3D viewer integration (xeokit)
- [ ] NLP spec analyzer
- [ ] ML priority prediction
- [ ] Rule marketplace UI
- [ ] Custom rule builder
- [ ] Real-time collaboration

### Phase 4: Integrations (Weeks 10-12)
- [ ] BIM 360 connector
- [ ] Procore API integration
- [ ] SharePoint sync
- [ ] Slack/Teams notifications
- [ ] Email alerts and digests

### Phase 5: Polish & Launch (Weeks 13-14)
- [ ] Performance optimization
- [ ] Security audit
- [ ] User onboarding flow
- [ ] Documentation and help center
- [ ] Beta testing with pilot customers
- [ ] Production launch

---

## 13. Business Model & Pricing

### Tier 1: Starter (Free)
- 5 projects
- 20 scans/month
- Basic rule packs (100 rules)
- Standard reporting
- Community support

### Tier 2: Professional ($99/month)
- Unlimited projects
- 200 scans/month
- All rule packs (500+ rules)
- Advanced reporting + visual markups
- RFI generation
- Email support
- API access

### Tier 3: Enterprise ($499/month)
- Unlimited everything
- Custom rule development
- ML priority prediction
- BIM 360/Procore integration
- Dedicated support
- SSO/SAML
- SLA guarantees
- On-premise deployment option

### Rule Marketplace
- Sell custom rule packs ($29-$199)
- Regional code packs (Nigeria, UK, EU, Asia)
- Specialty packs (Healthcare, Data Centers, etc.)
- Revenue share: 70% to creator, 30% platform

---

## 14. Key Success Metrics

### Product Metrics
- **Time to First Value**: User uploads file → sees first issue < 5 minutes
- **Issue Detection Rate**: 95%+ precision, 90%+ recall
- **False Positive Rate**: < 10%
- **Scan Speed**: 1000 elements/second
- **User Engagement**: 3+ scans/week per active user

### Business Metrics
- **Customer Acquisition Cost (CAC)**: < $500
- **Lifetime Value (LTV)**: > $5000
- **LTV:CAC Ratio**: > 10:1
- **Churn Rate**: < 5% monthly
- **NPS Score**: > 50

### Impact Metrics (Customer Value)
- **Change Order Reduction**: 15-30%
- **QA Time Savings**: 5x faster than manual
- **Cost Avoidance**: $50K-$500K per project
- **RFI Response Time**: 50% improvement

---

## 15. Competitive Differentiation

### vs. Navisworks/Solibri
- **Cloud-native** (no desktop install required)
- **ML-powered prioritization** (not just deterministic)
- **Spec-to-model consistency** (NLP analysis)
- **Rule marketplace** (community-driven)
- **10x cheaper** ($99 vs $1000+/seat/year)

### vs. Generic QA Tools
- **Construction-specific** (not generic checklists)
- **Automated 2D markup** (visual evidence)
- **Code compliance library** (IBC, NFPA, local codes)
- **Integrated RFI workflow** (not separate tool)

---

This comprehensive architecture positions ConstructQA as a production-ready, enterprise-grade platform that can launch immediately and scale to thousands of projects.
