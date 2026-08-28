export const DIAGRAM_QUALITY_GUIDELINES = `
Diagram quality checklist:
- First identify the diagram's purpose, audience, and the clearest diagram type for the user's intent.
- Preserve the user's domain terms, important relationships, and requested style; do not invent unnecessary systems or steps.
- Plan the layout before generating code: group related items, choose a clear reading direction, and keep the main flow obvious.
- Plan connections before finalizing positions: place related nodes close together, keep edges short, and avoid drawing lines through nodes, labels, or container titles.
- Use visual hierarchy: title or main subject first, primary elements more prominent, secondary details quieter.
- Keep labels short and scannable; split long text into smaller nodes or notes instead of creating oversized labels.
- Avoid clutter: reduce crossing lines, avoid overlapping elements, and remove decorative details that do not improve understanding.
- Route connectors deliberately: use orthogonal or straight lines for simple same-direction flows, and use curved or routed connectors for cross-lane, feedback, dependency, or dense relationships.
- Keep connector semantics readable: label important edges, use consistent arrow direction, separate sync/async or primary/secondary paths with style differences, and never let edge labels overlap shapes.
- If a generated layout would create crossing or overlapping connectors, rearrange nodes first, then use curved edges, waypoints, or hub nodes to route around shapes and labels.
- Keep arrowheads outside node text areas: connect to the nearest clean side of the target, not through the node center.
- Use consistent shapes, colors, line styles, spacing, and naming conventions for the same kind of concept.
- Prefer professional, accessible color palettes with enough contrast; use color to encode meaning, not as random decoration.
- For architecture and process diagrams, show boundaries, ownership, direction of data/control flow, and key decision points.
- For edits, preserve stable parts of the current diagram and improve only what the user asked to change.
- Before calling the display tool, self-check that the diagram is syntactically valid, complete, readable, and renderable.
`;

type ProfessionalPattern = {
    keywords: string[];
    guidance: string;
};

const PROFESSIONAL_PATTERNS: ProfessionalPattern[] = [
    {
        keywords: [
            "architecture",
            "system design",
            "c4",
            "架构",
            "系统设计",
            "技术方案",
            "服务架构",
        ],
        guidance: `
Software architecture diagram patterns:
- Show explicit boundaries: users/clients, edge, application services, data stores, external systems, and operations/observability.
- Separate layers or bounded contexts instead of mixing UI, services, databases, and infrastructure in one flat cluster.
- Make data/control direction unambiguous; label important sync/async paths, protocols, and ownership.
- Arrange layers in a stable reading direction, usually client -> edge -> service -> data/infra, so most connectors run horizontally or vertically without backtracking.
- Include reliability and security elements when relevant: load balancer, cache, queue, retry, circuit breaker, auth, secrets, monitoring, logging, backup, and disaster recovery.
- Prefer C4-like levels: Context for stakeholders/systems, Container for apps/services/datastores, Component only when implementation detail is requested.
`,
    },
    {
        keywords: [
            "business process",
            "workflow",
            "flow",
            "approval",
            "bpmn",
            "业务流程",
            "流程图",
            "审批",
            "工单",
            "订单流程",
        ],
        guidance: `
Business process diagram patterns:
- Start with one clear trigger and end state; show the happy path first, then exception paths.
- Use swimlanes or grouped sections for roles, departments, systems, or responsibility boundaries.
- Mark decision gateways as questions with yes/no or condition labels; avoid unlabeled branches.
- Keep the main process path in one direction inside each swimlane; route cross-lane handoffs at lane boundaries to avoid diagonals through activities.
- Show handoffs, approvals, retries, rejection, timeout, and rollback paths when they affect business behavior.
- Keep each activity verb-led and concise, e.g. "Validate order", "Approve refund", "Notify customer".
`,
    },
    {
        keywords: [
            "sequence",
            "interaction",
            "call chain",
            "时序",
            "调用链",
            "交互流程",
            "接口调用",
        ],
        guidance: `
Sequence diagram patterns:
- Put actors/services left to right by initiation order or trust boundary.
- Keep message names action-oriented and include critical payload/status only when useful.
- Use alt/opt/loop/group blocks for branching, retries, timeout, and async callbacks.
- Distinguish synchronous calls, asynchronous events, and return values visually where the syntax supports it.
- Avoid crossing lifeline interactions by keeping the initiating actor and most frequently called services near each other.
- Avoid turning architecture into sequence unless the user asks for runtime interactions.
`,
    },
    {
        keywords: [
            "er",
            "erd",
            "database",
            "schema",
            "数据模型",
            "数据库",
            "实体关系",
            "表结构",
            "领域模型",
        ],
        guidance: `
Data model and ERD patterns:
- Identify core entities first, then relationships, cardinality, ownership, and lifecycle constraints.
- Include primary keys, important foreign keys, and only business-critical attributes unless the user asks for full schema.
- Separate transactional entities from reference/configuration entities when that improves readability.
- Show optionality and one-to-many/many-to-many relationships explicitly.
- Place associative/junction entities between the entities they connect so relationship lines stay short and do not cross unrelated tables.
- Use consistent naming conventions and avoid mixing physical database details with conceptual domain language unless requested.
`,
    },
    {
        keywords: [
            "cloud",
            "aws",
            "azure",
            "gcp",
            "kubernetes",
            "k8s",
            "云",
            "云原生",
            "容器",
            "集群",
            "部署",
        ],
        guidance: `
Cloud and deployment diagram patterns:
- Show regions/zones, VPC/VNet, public/private subnets, ingress/egress, compute, storage, and managed services as separate boundaries.
- Place security controls near boundaries: WAF, gateway, IAM, security groups, private endpoints, secrets, and audit logs.
- Make high availability visible with multi-zone replicas, health checks, autoscaling, queues, and failover paths.
- Distinguish runtime traffic, admin access, CI/CD deployment flow, and observability pipelines when relevant.
- Keep north-south traffic vertical and east-west service traffic horizontal when possible; route admin/observability flows separately from runtime traffic.
- Use vendor-specific names/icons only when the user asks for a vendor-specific architecture.
`,
    },
    {
        keywords: [
            "microservice",
            "microservices",
            "ddd",
            "event driven",
            "message queue",
            "微服务",
            "领域驱动",
            "事件驱动",
            "消息队列",
            "mq",
        ],
        guidance: `
Microservice and event-driven patterns:
- Group services by bounded context, not by technical layer alone.
- Show owned databases per service unless a shared database is explicitly required.
- Label sync API calls separately from async events; include broker/topic/queue names when useful.
- Add cross-cutting capabilities such as service discovery, gateway, config, auth, tracing, metrics, and logs when the diagram scope includes platform concerns.
- Avoid too many direct service-to-service edges; route through gateway, broker, or clearly grouped interfaces where appropriate to prevent connector tangles.
`,
    },
    {
        keywords: [
            "data pipeline",
            "etl",
            "streaming",
            "analytics",
            "数据流",
            "数仓",
            "数据管道",
            "实时计算",
            "离线计算",
        ],
        guidance: `
Data pipeline diagram patterns:
- Separate sources, ingestion, processing, storage, serving, and governance/monitoring.
- Label batch vs streaming paths and show latency or schedule only when relevant.
- Include data quality checks, schema registry/catalog, lineage, retry/dead-letter handling, and access control when appropriate.
- Use arrows to represent data movement, not organizational relationships.
- Keep the pipeline left-to-right or top-to-bottom with branch/merge points explicitly shown; do not draw long diagonal data paths across stages.
- Keep transformations named by business meaning, not only tool names.
`,
    },
];

export function getProfessionalDiagramGuidelines(userInput: string) {
    const normalizedInput = userInput.toLowerCase();
    const matchedGuidance = PROFESSIONAL_PATTERNS
        .filter((pattern) =>
            pattern.keywords.some((keyword) =>
                normalizedInput.includes(keyword.toLowerCase())
            )
        )
        .slice(0, 3)
        .map((pattern) => pattern.guidance.trim());

    const selectedGuidance =
        matchedGuidance.length > 0
            ? matchedGuidance.join("\n\n")
            : `
General professional diagram patterns:
- Infer the most useful professional diagram type from the request instead of defaulting to a generic flowchart.
- Add the minimum missing context needed for a useful diagram: actors, systems, responsibilities, boundaries, flows, and exceptions.
- Prefer industry-standard structure over decorative styling; the diagram should explain decisions, ownership, and flow.
- Optimize connector readability before visual polish: fewer crossings, shorter edges, clear ports, curved/routed lines where helpful, and visible labels.
- If the request is vague, choose a common best-practice layout and keep assumptions visible in labels or notes.
`.trim();

    return `
Professional diagram guidance selected for this request:
The following guidance is curated from common industry diagramming practices. It is not live web retrieval.

${selectedGuidance}
`.trim();
}
