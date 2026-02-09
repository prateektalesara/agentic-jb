sequenceDiagram
    autonumber
    participant Client
    participant API as Enquiry Service<br/>[API / DB Owner]
    participant Proc as EnquiryProcessor<br/>[Listener / Orchestrator]
    participant TMX_Adp as TMX Adapter<br/>[REST Wrapper]
    participant SIRA_Adp as SIRA Adapter<br/>[REST Wrapper]
    participant Case_W as Case Processor<br/>[Worker]
    participant Ext_CRM as External CRM

    Note over Client, API: Phase 1: Ingestion
    Client->>API: POST /enquire
    API->>API: Save to DB (Status: RECEIVED)
    API--)Proc: Event: EnquiryCreatedEvent
    API-->>Client: 202 Accepted

    Note over Proc, SIRA_Adp: Phase 2: Processing (Enrichment & Decision)
    Proc->>TMX_Adp: REST: Enrich Request
    Note right of Proc: Circuit Breaker / Bulkhead
    TMX_Adp->>TMX_Adp: Call External TMX
    TMX_Adp-->>Proc: Enrichment Data

    Proc->>SIRA_Adp: REST: Get Decision
    SIRA_Adp->>SIRA_Adp: SOAP Call to External SIRA
    SIRA_Adp-->>Proc: Decision (CLEARED / DECLINE / REFERRED)

    Note over Proc, API: Phase 3: Decision Handling
    alt Decision is CLEARED or DECLINE
        Proc--)API: Event: ENQUIRY_UPDATE_EVENT
        API->>API: Update DB (Status: CLEARED/DECLINE)
    
    else Decision is REFERRED
        par Update Enquiry Status
            Proc--)API: Event: ENQUIRY_UPDATE_EVENT
            API->>API: Update DB (Status: REFERRED)
        and Trigger Case Creation
            Proc--)Case_W: Event: CASE_REFERRED_EVENT
        end
    end

    Note over Case_W, Ext_CRM: Phase 4: Case Management
    Case_W->>Ext_CRM: Create Case (REST/SOAP)
    Ext_CRM-->>Case_W: Case ID Created

    Note over API, Ext_CRM: Phase 5: Closing the Loop
    Note right of API: Enquiry Service listens to<br/>Case Update Events
    Ext_CRM--)API: Event: Case Update (via Webhook/Worker)
    API->>API: Update DB (Link Case ID)