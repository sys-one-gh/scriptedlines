# ScriptedLines — Master Build Plan
# 8 Phases — Full Detail
# Generated: May 2026
# ─────────────────────────────────────────────────────────────


═══════════════════════════════════════════════════════════════
PHASE 1 — CLEANUP
═══════════════════════════════════════════════════════════════

Goal: Remove temporary seed infrastructure now that the backup/
restore workflow is solid. Clean the codebase before building
new features.

─── Files to Delete ──────────────────────────────────────────

  backend/models/default_products.py
    → Was used to seed 81 products on first run.
    → No longer needed — restore_db.sh handles all new machines.
    → Delete this file entirely.

  backend/seed.py
    → Was used to manually drop and reseed the database.
    → No longer needed — restore_db.sh replaces it.
    → Delete this file entirely.

─── Files to Update ──────────────────────────────────────────

  backend/main.py
    → Remove the @app.on_event("startup") auto-seed block.
    → Remove the import of ALL_PRODUCTS from default_products.
    → Remove the import of SessionLocal used only for seeding.
    → Keep: Base.metadata.create_all(bind=engine) — this line
      stays so new tables are created automatically on startup.
    → Keep: all existing routes and CORS configuration.

─── Verification ─────────────────────────────────────────────

  After cleanup:
  - Restart the backend server.
  - Hit GET /api/health — should return ok.
  - Hit GET /api/products — should return all 81 products.
  - Confirm no import errors in the terminal.
  - Confirm database still has 81 products via psql count.

─── Commit ───────────────────────────────────────────────────

  Message: "Phase 1 — Remove seed infrastructure, restore
  workflow is now the source of truth"


═══════════════════════════════════════════════════════════════
PHASE 2 — DATABASE TABLES
═══════════════════════════════════════════════════════════════

Goal: Design and create all database tables needed for the
entire application. Every table is created now even if the
UI for it is built in a later phase. This way the database
schema is complete and stable before any frontend work begins.

─── Design Principles ────────────────────────────────────────

  - All tables use integer primary keys with autoincrement.
  - All tables have created_at and updated_at timestamps.
  - Nothing is ever hard deleted — soft delete via is_active
    or status fields.
  - All foreign keys are explicit and indexed.
  - No hardcoded company or user IDs anywhere in the code.
  - All enum fields use Python Enum classes for type safety.

─── Table 1: companies ───────────────────────────────────────

  Purpose: Stores the account for each millwork company using
  ScriptedLines. Multi-tenant root table. Every other table
  traces back to a company.

  Fields:
    id                  INTEGER PK autoincrement
    company_name        VARCHAR not null
    company_address     VARCHAR
    company_city        VARCHAR
    company_province    VARCHAR
    company_postal_code VARCHAR
    company_phone       VARCHAR
    company_fax         VARCHAR
    company_email       VARCHAR
    company_website     VARCHAR
    logo_url            VARCHAR  (path to uploaded logo file)
    is_active           BOOLEAN default true
    created_at          TIMESTAMP default now()
    updated_at          TIMESTAMP onupdate now()

  Notes:
    - For Phase 2 we seed one row: ScriptedLines own company.
    - Multi-company (SaaS billing) added in a future phase.
    - logo_url will be used in the drawing title block.

─── Table 2: users ───────────────────────────────────────────

  Purpose: Stores all user accounts. Each user belongs to one
  company. Users create projects and drawings.

  Fields:
    id                  INTEGER PK autoincrement
    company_id          INTEGER FK → companies.id not null
    first_name          VARCHAR not null
    last_name           VARCHAR not null
    email               VARCHAR unique not null
    password_hash       VARCHAR not null  (bcrypt hashed)
    role                ENUM: owner, admin, draftsman, viewer
    initials            VARCHAR  (e.g. RPB — appears on drawings)
    is_active           BOOLEAN default true
    last_login          TIMESTAMP nullable
    created_at          TIMESTAMP default now()
    updated_at          TIMESTAMP onupdate now()

  Notes:
    - Password is NEVER stored in plain text.
    - bcrypt is used for hashing — work factor 12.
    - Authentication (JWT tokens) is added in a later phase.
    - For now the login page is built but auth is not enforced.
    - initials field is used in the revision table on drawings.
    - role controls what actions users can take (future).

─── Table 3: projects ────────────────────────────────────────

  Purpose: Stores each millwork project. A project contains
  one or more drawings. All project properties that appear
  in the drawing title block are stored here.

  Fields:
    id                        INTEGER PK autoincrement
    company_id                INTEGER FK → companies.id not null
    created_by                INTEGER FK → users.id not null

    -- Identity
    project_name              VARCHAR not null
    project_number            VARCHAR
    job_number                VARCHAR  (e.g. 1930)
    description               TEXT     (job description)

    -- Classification
    project_grade             ENUM: Custom, Premium, Standard,
                                    Commercial, Institutional
    standard                  ENUM: AWMAC, AWI, WI

    -- Client Info
    client_name               VARCHAR
    client_address            VARCHAR
    client_phone              VARCHAR
    client_fax                VARCHAR
    client_email              VARCHAR

    -- Job Site Info
    jobsite_name              VARCHAR
    jobsite_address           VARCHAR
    jobsite_phone             VARCHAR
    jobsite_fax               VARCHAR
    jobsite_email             VARCHAR

    -- Team
    contractor_name           VARCHAR
    architect_name            VARCHAR
    estimator_name            VARCHAR
    project_manager           VARCHAR
    draftsman                 VARCHAR
    drawn_by                  VARCHAR
    checked_by                VARCHAR

    -- Schedule and Budget
    scheduled_start_date      DATE nullable
    scheduled_completion_date DATE nullable
    project_budget            FLOAT nullable

    -- Status
    status                    ENUM: active, archived
    is_inactive               BOOLEAN default false

    created_at                TIMESTAMP default now()
    updated_at                TIMESTAMP onupdate now()

  Notes:
    - One project can have many drawings.
    - Project properties auto-populate the title block of every
      drawing created under that project.
    - is_inactive = true hides the project from the active list
      but never deletes it.

─── Table 4: drawings ────────────────────────────────────────

  Purpose: Stores each individual drawing sheet. One row per
  drawing. When a drawing is created, two things happen
  automatically:
    1. A row is inserted in this table.
    2. An empty BOM table entry is created for this drawing.

  Fields:
    id                  INTEGER PK autoincrement
    project_id          INTEGER FK → projects.id not null
    created_by          INTEGER FK → users.id not null

    -- Identity (all user-assigned)
    drawing_number      VARCHAR not null  (e.g. D95.01)
    title               VARCHAR not null  (e.g. Staff Lunch)
    revision            VARCHAR default "00"
    level               VARCHAR  (e.g. 1G)
    location            VARCHAR  (e.g. 4.4.01)
    arch_ref            VARCHAR  (e.g. 7 A2.46B / REV#11)
    item_description    VARCHAR  (the ITEM field in title block)

    -- Paper
    scale               VARCHAR default "1:20"
    paper_size          ENUM: Arch_D, Arch_E, Letter, Tabloid
    page_number         INTEGER default 1
    total_pages         INTEGER default 1

    -- Canvas Data
    svg_data            JSON  (all placed objects, walls, dims)

    -- Status
    status              ENUM: draft, review, approved, issued
    for_client_review   BOOLEAN default false
    for_production      BOOLEAN default false
    qty                 INTEGER default 1

    created_at          TIMESTAMP default now()
    updated_at          TIMESTAMP onupdate now()

  Notes:
    - svg_data stores the entire canvas state as JSON.
    - page_number and total_pages are managed by the app as
      drawings are added/removed from a project.
    - for_client_review and for_production match the checkboxes
      seen at the bottom of the title block in the PDF.

─── Table 5: drawing_revisions ───────────────────────────────

  Purpose: Stores the revision history for each drawing.
  Matches the REV 00-05 table in the PDF title block.

  Fields:
    id                  INTEGER PK autoincrement
    drawing_id          INTEGER FK → drawings.id not null
    revision_number     VARCHAR not null  (00, 01, 02, 03...)
    date                DATE
    initials            VARCHAR  (e.g. RPB / VK)
    description         VARCHAR  (e.g. "Issued for Review")
    created_at          TIMESTAMP default now()

  Notes:
    - Each drawing starts with revision 00 row created empty.
    - Up to 6 rows shown in the title block (00-05).
    - More revisions can exist — only last 6 show in block.

─── Table 6: drawing_finish_schedule ─────────────────────────

  Purpose: Stores finish materials listed in the title block.
  Matches the Finish Schedule table in the PDF.

  Fields:
    id                  INTEGER PK autoincrement
    drawing_id          INTEGER FK → drawings.id not null
    code                VARCHAR  (e.g. PLAM-01, SS-02, ML-01)
    description         VARCHAR  (e.g. Formica #8844-58 FSC)
    material            VARCHAR  (e.g. Laminate)
    core_notes          VARCHAR  (e.g. Particle Board)
    sort_order          INTEGER default 0
    created_at          TIMESTAMP default now()

─── Table 7: drawing_hardware_schedule ───────────────────────

  Purpose: Stores hardware items listed in the title block.
  Matches the Hardware Schedule table in the PDF.

  Fields:
    id                  INTEGER PK autoincrement
    drawing_id          INTEGER FK → drawings.id not null
    code                VARCHAR  (e.g. H3, H10, H26)
    quantity            INTEGER
    description         VARCHAR  (full hardware description)
    sort_order          INTEGER default 0
    created_at          TIMESTAMP default now()

─── Table 8: drawing_products ────────────────────────────────

  Purpose: Stores every product instance placed on a drawing
  canvas. One row per product dropped on the paper. This is
  NOT the same as the BOM — this is the spatial canvas data.

  Fields:
    id                  INTEGER PK autoincrement
    drawing_id          INTEGER FK → drawings.id not null
    product_id          INTEGER FK → library_products.id not null
    instance_code       VARCHAR  (e.g. FL-B1D-01, auto-assigned)

    -- Canvas Position (in mm)
    x                   FLOAT not null
    y                   FLOAT not null
    rotation            INTEGER default 0  (0, 90, 180, 270)

    -- Confirmed Dimensions (user-entered in drop form)
    width               FLOAT not null
    height              FLOAT not null
    depth               FLOAT not null
    doors               INTEGER default 0
    drawers             INTEGER default 0
    shelves             INTEGER default 0

    -- Drawing Properties
    label               VARCHAR  (text shown on drawing)
    notes               VARCHAR  (internal notes)
    sort_order          INTEGER default 0

    -- Status
    is_active           BOOLEAN default true

    created_at          TIMESTAMP default now()
    updated_at          TIMESTAMP onupdate now()

  Notes:
    - instance_code is auto-generated per drawing.
      Format: {product_code}-{sequence}
      Example: first FL-B1D dropped = FL-B1D-01
               second FL-B1D dropped = FL-B1D-02
    - A product saved here is saved to the USER'S project,
      not to the ScriptedLines library.

─── Table 9: drawing_bom ─────────────────────────────────────

  Purpose: Bill of Materials for each drawing. Created
  automatically when a new drawing is created (empty).
  Populated when user clicks "Add to BOM" in the drop form.

  Fields:
    id                  INTEGER PK autoincrement
    drawing_id          INTEGER FK → drawings.id not null unique
    created_at          TIMESTAMP default now()
    updated_at          TIMESTAMP onupdate now()

─── Table 10: drawing_bom_items ──────────────────────────────

  Purpose: Individual line items in the BOM. Each row is one
  product type with a quantity and all its specifications.

  Fields:
    id                  INTEGER PK autoincrement
    bom_id              INTEGER FK → drawing_bom.id not null
    drawing_product_id  INTEGER FK → drawing_products.id nullable
    product_id          INTEGER FK → library_products.id not null
    instance_code       VARCHAR  (e.g. FL-B1D-01)
    product_code        VARCHAR  (e.g. FL-B1D)
    product_name        VARCHAR
    quantity            INTEGER default 1
    width               FLOAT
    height              FLOAT
    depth               FLOAT
    doors               INTEGER
    drawers             INTEGER
    shelves             INTEGER
    material_exterior   VARCHAR
    material_interior   VARCHAR
    finish_code         VARCHAR  (references finish schedule)
    hardware_notes      VARCHAR
    notes               VARCHAR
    sort_order          INTEGER default 0
    created_at          TIMESTAMP default now()
    updated_at          TIMESTAMP onupdate now()

  Notes:
    - BOM is populated via "Add to BOM" button in drop form.
    - BOM can also be edited directly in a future BOM view.
    - BOM is the document sent to production.

─── Verification ─────────────────────────────────────────────

  After creating all models and running startup:
  - All 10 new tables visible in VS Code PostgreSQL extension.
  - library_products still intact with 81 products.
  - No migration errors in the terminal.

─── Commit ───────────────────────────────────────────────────

  Message: "Phase 2 — All database tables created"


═══════════════════════════════════════════════════════════════
PHASE 3 — BACKEND API ROUTES
═══════════════════════════════════════════════════════════════

Goal: Build all FastAPI endpoints needed for the frontend.
Every route is built and tested before any frontend work
begins on that feature.

─── Router Files ─────────────────────────────────────────────

  backend/api/companies.py
  backend/api/users.py
  backend/api/projects.py
  backend/api/drawings.py
  backend/api/bom.py

─── Companies Routes ─────────────────────────────────────────

  GET    /api/companies/:id
    Returns company info for display in title block.

  PUT    /api/companies/:id
    Update company name, address, contact, logo.

─── Users Routes ─────────────────────────────────────────────

  POST   /api/users/register
    Creates new user. Hashes password with bcrypt.
    Returns user record (no password hash).

  POST   /api/users/login
    Checks email + password. Returns user record.
    Authentication tokens added in a later phase.
    For now returns user object on success.

  GET    /api/users/:id
    Returns single user record.

  PUT    /api/users/:id
    Update name, initials, role.

─── Projects Routes ──────────────────────────────────────────

  POST   /api/projects
    Creates new project.
    Body: all project fields.
    Returns: created project with id.

  GET    /api/projects
    Returns all projects for a company.
    Query params: status (active/archived), search.
    Grouped by status for left panel display.

  GET    /api/projects/:id
    Returns single project with all fields.

  PUT    /api/projects/:id
    Update any project field.
    Returns updated project.

  DELETE /api/projects/:id
    Soft delete — sets is_inactive = true.
    Does not delete drawings.

─── Drawings Routes ──────────────────────────────────────────

  POST   /api/drawings
    Creates new drawing.
    ALSO automatically:
      1. Creates a drawing_bom row for this drawing.
      2. Creates revision 00 row in drawing_revisions.
      3. Sets page_number and updates total_pages on all
         drawings in the project.
    Body: project_id, drawing_number, title, scale,
          level, location, arch_ref, paper_size.
    Returns: created drawing with id.

  GET    /api/drawings/project/:project_id
    Returns all drawings for a project.
    Ordered by page_number.

  GET    /api/drawings/:id
    Returns single drawing with all related data:
      - drawing fields
      - revisions list
      - finish schedule list
      - hardware schedule list
      - products list

  PUT    /api/drawings/:id
    Update drawing fields.
    Also handles saving svg_data (canvas state).

  DELETE /api/drawings/:id
    Soft delete — sets status to archived.

─── Drawing Products Routes ──────────────────────────────────

  POST   /api/drawings/:id/products
    Saves a product to a drawing (from drop form Save button).
    Auto-generates instance_code.
    Body: all drawing_products fields.
    Returns: saved product with instance_code.

  GET    /api/drawings/:id/products
    Returns all products on a drawing.

  PUT    /api/drawings/:id/products/:product_id
    Update product position, dimensions, notes.

  DELETE /api/drawings/:id/products/:product_id
    Removes product from drawing.

─── BOM Routes ───────────────────────────────────────────────

  POST   /api/bom/:drawing_id/items
    Adds a product to the BOM (from Add to BOM button).
    Body: all bom_items fields.
    Returns: created bom item.

  GET    /api/bom/:drawing_id
    Returns full BOM for a drawing with all items.

  PUT    /api/bom/:drawing_id/items/:item_id
    Update BOM item (quantity, notes, materials).

  DELETE /api/bom/:drawing_id/items/:item_id
    Remove item from BOM.

─── Verification ─────────────────────────────────────────────

  Test all routes via FastAPI /docs (Swagger UI).
  Confirm each route returns correct response shape.
  Confirm drawing creation triggers BOM + revision creation.
  Confirm soft deletes work correctly.

─── Commit ───────────────────────────────────────────────────

  Message: "Phase 3 — All API routes built and tested"


═══════════════════════════════════════════════════════════════
PHASE 4 — LOGIN AND REGISTER PAGES
═══════════════════════════════════════════════════════════════

Goal: Build login and register pages. No authentication
enforcement yet — pages are built correctly so adding JWT
tokens later requires minimal changes. Pages are polished,
professional, and match the ScriptedLines design system.

─── Page: /register ──────────────────────────────────────────

  Layout:
    - Centered card on dark background.
    - ScriptedLines logo/name at top.
    - Form fields:
        First Name (text, required)
        Last Name (text, required)
        Email (email, required)
        Password (password, required)
        Confirm Password (password, required)
    - Register button (full width, accent color).
    - "Already have an account? Log in" link.

  Behavior:
    - Client-side validation before submitting:
        All fields required.
        Email must be valid format.
        Password min 8 characters.
        Confirm password must match.
    - On submit: POST /api/users/register.
    - On success: redirect to /login.
    - On error: show error message inline.

  Notes:
    - Password field shows/hides toggle.
    - No captcha for now.
    - Company is auto-assigned to ScriptedLines company row
      (id=1) for now. Multi-company registration added later.

─── Page: /login ─────────────────────────────────────────────

  Layout:
    - Centered card on dark background.
    - ScriptedLines logo/name at top.
    - Form fields:
        Email (email, required)
        Password (password, required)
    - Login button (full width, accent color).
    - "Don't have an account? Register" link.
    - "Forgot password?" link (placeholder — not functional yet)

  Behavior:
    - On submit: POST /api/users/login.
    - On success: store user object in React context/state,
      redirect to /projects.
    - On failure: show "Invalid email or password" message.

  Notes:
    - For now user object stored in React state or localStorage.
    - When JWT is added later, token replaces localStorage user.
    - Login is NOT enforced on routes yet — that is auth phase.

─── React Router Setup ───────────────────────────────────────

  Routes:
    /               → redirect to /login
    /login          → LoginPage
    /register       → RegisterPage
    /projects       → ProjectsPage (Phase 5)
    /workspace      → Workspace (existing)

─── Commit ───────────────────────────────────────────────────

  Message: "Phase 4 — Login and register pages built"


═══════════════════════════════════════════════════════════════
PHASE 5 — PROJECTS PAGE
═══════════════════════════════════════════════════════════════

Goal: Build the projects page. This is the main landing page
after login. Users manage all their projects and drawings here.

─── Page Layout ──────────────────────────────────────────────

  URL: /projects

  Structure:
  ┌──────────────────────────────────────────────────────────┐
  │  TOP BAR (10vh)                                          │
  │  [ScriptedLines] [+ New Project] [User name / logout]    │
  ├──────────────────┬───────────────────────────────────────┤
  │  LEFT PANEL      │  MAIN AREA                            │
  │  18% wide        │  fills remaining width                │
  │  90vh tall       │                                       │
  └──────────────────┴───────────────────────────────────────┘

─── Top Bar ──────────────────────────────────────────────────

  Left: ScriptedLines logo/name
  Center: + New Project button (accent color)
  Right: User name display + Logout button

─── Left Panel ───────────────────────────────────────────────

  Same visual structure as workspace left panel.
  Same tab bar wrapper, same font sizes, same styling.

  Content: List of all projects grouped by status.
  Two groups:
    Active Projects  (collapsible, open by default)
      > Project Name — Job# 1930
      > Project Name — Job# 1931
    Archived Projects (collapsible, closed by default)
      > Project Name — Job# 1929

  Each project row:
    - Project name (primary text)
    - Job number (secondary text, muted)
    - Click to select and show drawings in main area
    - Right-click or hover: Edit / Archive / Delete options

  Bottom of left panel:
    - Small "+ New Project" text button as secondary action

─── Main Area — No Project Selected ─────────────────────────

  Show centered message:
    "Select a project from the left panel
     or create a new project to get started."
  With a large + New Project button below.

─── Main Area — Project Selected ────────────────────────────

  Top of main area:
    - Project name as heading
    - Job number, client name, grade, standard as subheading
    - [+ New Drawing] button (right aligned)
    - Search drawings input
    - Sort by: Drawing Number / Date Created / Status (dropdown)

  Drawings grid:
    Grid of drawing cards.
    Each card shows:
      - Drawing number (large, bold, accent color)
      - Title (medium text)
      - Revision badge (e.g. REV 02)
      - Status badge (Draft / Review / Approved / Issued)
        each status has its own color
      - Scale
      - Last modified date
      - Created by initials
      - [Open] button → navigates to /workspace with drawing id
      - [Delete] button → soft delete with confirmation

  Empty state (no drawings yet):
    Centered message: "No drawings yet. Create your first drawing."
    With + New Drawing button.

─── New Project Modal ────────────────────────────────────────

  Triggered by: + New Project button in top bar or left panel.

  Layout:
    Large modal (700px wide).
    Title: "New Project"
    5 sections laid out as a scrollable form.
    Each section has a section header.

  Section 1 — Project Identity:
    Project Name           (text, required)
    Project Number         (text)
    Job Number             (text)
    Description            (textarea, 3 rows)
    Project Grade          (dropdown):
      Custom / Premium / Standard / Commercial / Institutional
    Standard               (dropdown):
      AWMAC / AWI / WI

  Section 2 — Team:
    Drawn By               (text)
    Checked By             (text)
    Project Manager        (text)
    Draftsman              (text)
    Architect              (text)
    Estimator              (text)
    Contractor             (text)

  Section 3 — Client:
    Client Name            (text)
    Client Address         (text)
    Client Phone           (text)
    Client Fax             (text)
    Client Email           (email)

  Section 4 — Job Site:
    Job Site Name          (text)
    Job Site Address       (text)
    Job Site Phone         (text)
    Job Site Fax           (text)
    Job Site Email         (email)

  Section 5 — Schedule and Budget:
    Scheduled Start Date       (date)
    Scheduled Completion Date  (date)
    Project Budget             (number, dollar)

  Bottom buttons:
    [Cancel]  [Create Project]

  On Create:
    POST /api/projects.
    On success: close modal, project appears in left panel,
    auto-selected, main area shows empty drawings grid.

─── New Drawing Modal ────────────────────────────────────────

  Triggered by: + New Drawing button in main area.

  Layout:
    Medium modal (500px wide).
    Title: "New Drawing"

  Fields:
    Drawing Number         (text, required, e.g. D95.01)
    Title                  (text, required)
    Scale                  (dropdown: 1:4, 1:10, 1:20, 1:50,
                             1:100, As Noted)
    Level                  (text, e.g. 1G)
    Location               (text, e.g. 4.4.01)
    Arch Reference         (text, e.g. 7 A2.46B / REV#11)
    Paper Size             (dropdown: Arch D, Arch E)
    Item Description       (text, e.g. Staff Lunch Counter)

  Bottom buttons:
    [Cancel]  [Create Drawing]

  On Create:
    POST /api/drawings.
    This also auto-creates:
      - Empty drawing_bom row for this drawing.
      - Revision 00 row in drawing_revisions (empty).
    On success: close modal, drawing card appears in grid.

─── Commit ───────────────────────────────────────────────────

  Message: "Phase 5 — Projects page complete"


═══════════════════════════════════════════════════════════════
PHASE 6 — PRODUCT DROP FORM REDESIGN
═══════════════════════════════════════════════════════════════

Goal: Replace the current simple drop form with a full
multi-tab form. This form appears when a user drags a product
from the left panel and drops it on the canvas. It collects
all product configuration before saving to the drawing.

─── Form Structure ───────────────────────────────────────────

  Large modal (750px wide, tall enough for content).
  Header: Product name + product code.
  Subheader: Category / Subcategory.

  TAB BAR:
    Same visual structure as workspace left panel tab bar.
    Same height, same font size, same active/inactive styling.
    Same scroll arrows on each side.
    Same blue accent line on active tab.
    No exceptions — total visual consistency.

  10 Tabs:

    Tab 1: Dimensions
      Width              (number input, mm, pre-filled from library)
      Height             (number input, mm, pre-filled)
      Depth              (number input, mm, pre-filled)
      Note: dimensions are fully editable by user.

    Tab 2: Configuration
      Doors              (number input, pre-filled from library)
      Drawers            (number input, pre-filled from library)
      Shelves            (number input, pre-filled from library)
      Hinge Side         (dropdown: Left, Right, N/A)
      Door Type          (dropdown: Full Overlay, Inset, N/A)

    Tab 3: Material
      Exterior Material  (text or dropdown referencing finish schedule)
      Interior Material  (text or dropdown)
      Back Material      (text or dropdown)
      Sub-Top Material   (text or dropdown, if applicable)
      Edge Banding       (text or dropdown)

    Tab 4: Hardware
      Hinge Code         (text, references hardware schedule)
      Drawer Slide Code  (text)
      Pull Code          (text)
      Shelf Pin Code     (text)
      Other Hardware     (textarea)

    Tab 5: Finish
      Exterior Finish    (text or dropdown referencing finish schedule)
      Interior Finish    (text)
      Edge Finish        (text)
      Special Finish     (text)

    Tab 6: Label & Drawing
      Label              (text — what appears on the drawing)
      Show Label         (checkbox — show/hide on drawing)
      Show Dimensions    (checkbox)
      Show Product Code  (checkbox)
      Notes on Drawing   (textarea — appears as note bubble)

    Tab 7: Position
      X Position         (number, mm — editable after drop)
      Y Position         (number, mm — editable after drop)
      Rotation           (dropdown: 0°, 90°, 180°, 270°)

    Tab 8: Notes
      Internal Notes     (textarea — not shown on drawing)
      Production Notes   (textarea — shown in BOM)
      Client Notes       (textarea — shown on client copy)

    Tab 9: BOM
      BOM Description    (text — overrides product name in BOM)
      BOM Category       (text — for grouping in BOM)
      Include in BOM     (checkbox, default checked)
      BOM Notes          (textarea)

    Tab 10: Summary
      Read-only overview of all entered data.
      Shows a text summary of all tabs combined.
      "Review before saving."

─── Bottom Button Bar ────────────────────────────────────────

  Three buttons, always visible regardless of active tab:

  [Add to BOM]
    → Saves product to drawing_bom_items table.
    → Does NOT save the product to the canvas.
    → For adding products to BOM without placing on drawing.
    → Shows confirmation: "Added to BOM."

  [Discard]
    → Closes the form.
    → Does NOT save anything.
    → Product is removed from the canvas drop position.
    → Confirmation prompt: "Discard this product? It will
      not be saved to your drawing."

  [Save Product to Drawing]
    → Saves product to drawing_products table
      (the user's drawing, not the ScriptedLines library).
    → Keeps the product on the canvas.
    → Auto-generates instance_code (e.g. FL-B1D-01).
    → Closes the form.
    → Product appears on the canvas in its dropped position.

─── Notes ────────────────────────────────────────────────────

  - "Save Product to Drawing" saves to drawing_products.
    This is the user's data, stored under their drawing.
    It does NOT modify library_products.
  - "Add to BOM" saves to drawing_bom_items.
    Can be done independently or alongside Save to Drawing.
  - All 10 tabs remember their state while the form is open.
  - Pre-fill as much as possible from library_products defaults.
  - Tab bar must be pixel-identical to workspace left panel tabs.

─── Commit ───────────────────────────────────────────────────

  Message: "Phase 6 — Product drop form redesign complete"


═══════════════════════════════════════════════════════════════
PHASE 7 — WORKSPACE UPDATES
═══════════════════════════════════════════════════════════════

Goal: Update the workspace page with drawing-aware features.
Connect workspace to a real drawing loaded from the database.
Add drawing tabs in the top bar. Add Back to Projects button.

─── Top Bar Redesign ─────────────────────────────────────────

  Left side:
    [← Projects]  button — navigates back to /projects.
    Clicking shows confirmation if drawing has unsaved changes.

  Center — Drawing Tabs:
    Each open drawing is a tab.
    Tab shows: Drawing Number — Title (e.g. D95.01 — Staff Lunch)
    Active tab: blue accent underline, white text.
    Inactive tab: muted, same style as left panel tabs.
    [×] on each tab to close that drawing.
    [+] button at end to open another drawing from the project.
    Scroll arrows on each side if tabs overflow.
    Tab system is VISUALLY IDENTICAL to left panel tabs.

  Right side:
    [Save] button — saves svg_data to drawings table.
    Backend connection status indicator (keep from current).
    Revision indicator (shows current revision number).

─── Drawing Loading ──────────────────────────────────────────

  When workspace opens with a drawing id:
    GET /api/drawings/:id
    Loads: all drawing fields, placed products, revisions,
    finish schedule, hardware schedule.
    Canvas renders all placed products from drawing_products.

─── Canvas — Placed Products ────────────────────────────────

  Products saved to drawing_products render on canvas.
  Each placed product:
    - Renders its SVG shape (from geometry engine, Phase 8).
    - Shows its label if show_label = true.
    - Shows its instance_code (e.g. FL-B1D-01).
    - Is selectable (click to select).
    - Is movable (drag to reposition).
    - Is deletable (right-click → Remove from drawing).
    - When selected: shows handles, properties in right panel.

─── Right Panel — Properties ─────────────────────────────────

  When a product is selected on canvas:
    Shows all properties of that drawing_product row.
    Editable fields: width, height, depth, label, notes.
    [Edit Full Form] button → opens drop form for that product.
    [Remove] button → removes from canvas and drawing_products.

  When nothing selected:
    Shows drawing info: drawing number, title, revision, scale.

─── Auto-Save ────────────────────────────────────────────────

  Canvas state auto-saves to svg_data every 2 minutes.
  Manual save button always available.
  "Unsaved changes" indicator in top bar when dirty.

─── Commit ───────────────────────────────────────────────────

  Message: "Phase 7 — Workspace updated for drawing-aware
  loading and tab system"


═══════════════════════════════════════════════════════════════
PHASE 8 — DRAWING TEMPLATE AND TITLE BLOCK
═══════════════════════════════════════════════════════════════

Goal: Build the SVG title block that appears on the right side
of every drawing sheet. Auto-populated from project and drawing
data. Configurable company info from the companies table.

─── Title Block Layout ───────────────────────────────────────

  Position: Fixed SVG region on the right side of the paper.
  Width: ~20% of paper width (approximately 180mm on Arch D).
  Height: Full paper height.
  Border: 1px solid black box around the entire block.

  Sections top to bottom (each separated by horizontal line):

  1. Company Header
     Company logo (from companies.logo_url).
     Company name (large, bold).
     Address, phone, fax, toll free, email.

  2. Legal Notice
     "This drawing is the exclusive property of [company name]
     and must not be reproduced without their written permission.
     This drawing must not be scaled. The contractor must verify
     all levels, datum and dimensions at site..."
     Small font, fixed text. Company name is dynamic.

  3. Please Confirm Section
     Bold header: "PLEASE CONFIRM AND REVIEW THE FOLLOWING"

  4. Important Notes
     Numbered list (01, 02, 03...).
     Editable per drawing.
     Default: "Client to confirm all design and function
     aspects are met."

  5. Material Core Notes
     Numbered list.
     Editable per drawing.
     Pre-populated from project defaults when drawing created.

  6. Edge General Notes
     Short numbered list.
     Editable per drawing.

  7. Finish Schedule Table
     Columns: Code | Description | Material | Core | Notes
     Rows from drawing_finish_schedule table.
     Editable — rows can be added/removed.

  8. Hardware Schedule Table
     Columns: Code | Qty | Description
     Rows from drawing_hardware_schedule table.
     Editable — rows can be added/removed.

  9. Other Instructions
     Free text area.
     Numbered list, editable.

  10. Approval Stamp Area
     "This drawing while returned 'Approved as Noted' are
     being resubmitted for final record."
     Fixed boilerplate text. Small font.

  11. Revision Table
     Columns: REV # | DATE | INITIAL | DESCRIPTION
     6 rows (00 through 05).
     From drawing_revisions table.
     Rows added as revisions are made.

  12. Status Checkboxes
     For Client Review ☐    For Production ☐    QTY: ___
     From drawing.for_client_review, for_production, qty fields.

  13. Client Info Block
     CLIENT: [client_name from projects]
     ADDRESS: [client_address]
     PHONE: [client_phone]
     FAX: [client_fax]
     EMAIL: [client_email]

  14. Job Site Block
     JOB SITE: [jobsite_name]
     ADDRESS: [jobsite_address]
     PHONE: [jobsite_phone]
     FAX: [jobsite_fax]
     EMAIL: [jobsite_email]

  15. Project Grade Block
     PROJECT GRADE: [project_grade from projects]

  16. Bottom Corner Block (smallest text, most dense)
     SP CL / W-PATH / HD/CH details
     LEVEL: [level]    LOCATION: [location]
     ITEM: [item_description]
     ARCH.REF: [arch_ref]
     DRAWN: [drawn_by]    CHECK: [checked_by]
     DATE: [drawing created_at date]    SCALE: [scale]
     DRAWING NO.: [drawing_number]
     PAGE NO.: [page_number] OF [total_pages]
     JOB NO.: [job_number]

─── Legend Bar ───────────────────────────────────────────────

  Horizontal bar across the full bottom of the paper.
  Shows drawing symbols and their meanings.
  Standard millwork symbols: split cleat, wire pathway,
  hidden channel, V-groove, hardware N/R, part N/R,
  field joint, all surface finish, casing N/R, finish N/R,
  edge N/R, spline N/R, open finish opposite side,
  finish on opposite side, grain direction.
  Fixed SVG — same on every drawing.

─── Dynamic Population ───────────────────────────────────────

  When a drawing is loaded in workspace:
    Title block auto-populates all fields from:
      - projects table (client, jobsite, team, grade, standard)
      - drawings table (drawing number, title, scale, etc.)
      - companies table (company name, address, logo)
      - drawing_revisions table (revision rows)
      - drawing_finish_schedule table (finish rows)
      - drawing_hardware_schedule table (hardware rows)

  When project data changes (user edits project properties):
    All drawings under that project reflect the update
    automatically — because title block reads from DB on load.

─── Editability ──────────────────────────────────────────────

  Some title block fields are directly editable on canvas:
    - Important Notes (click to edit inline)
    - Material Core Notes (click to edit inline)
    - Edge General Notes (click to edit inline)
    - Finish Schedule rows (click to edit)
    - Hardware Schedule rows (click to edit)
    - Other Instructions (click to edit)
    - Revision rows (click to add/edit)
    - For Client Review / For Production checkboxes

  Some fields are read-only in title block
  (edited via project settings or drawing settings):
    - Company info (edit via company settings)
    - Client info (edit via project settings)
    - Job site info (edit via project settings)
    - Drawn by / Checked by (edit via project settings)
    - Drawing number / title / scale (edit via drawing settings)

─── Commit ───────────────────────────────────────────────────

  Message: "Phase 8 — Drawing template and title block complete"


═══════════════════════════════════════════════════════════════
SUMMARY — BUILD ORDER AND DEPENDENCIES
═══════════════════════════════════════════════════════════════

  Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
    → Phase 6 → Phase 7 → Phase 8

  Each phase depends on the previous.
  No phase should be started until the previous is tested
  and committed to git.

  Estimated scope:
    Phase 1:  30 minutes
    Phase 2:  2-3 hours
    Phase 3:  3-4 hours
    Phase 4:  2-3 hours
    Phase 5:  4-6 hours
    Phase 6:  3-4 hours
    Phase 7:  4-6 hours
    Phase 8:  6-8 hours

  Total: approximately 5-7 full working days.

═══════════════════════════════════════════════════════════════
END OF PLAN
═══════════════════════════════════════════════════════════════