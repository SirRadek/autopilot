# Manual Override

Humans with admin/editor authority may:

- move task state
- change assignment
- mark lead as spam, lost, won, blocked, or reviewing
- retry or cancel task execution
- correct bad metadata
- change opportunity review status
- block a source or opportunity row
- purge opportunity personal data
- convert an opportunity into a lead or linked workflow task

Every override must record:

- actor identity
- reason
- previous value
- new value
- timestamp
- linked task or lead
- linked opportunity item when relevant
- `manual_override_applied` workflow event

Overrides must not delete previous events. If old evidence is wrong, append a correction event.

Terminal task states (`done`, `failed`, `cancelled`) must not move back to active states through workflow APIs without a `manual_override_applied` event and a human-readable reason. Payload admin edits are audited as `payload_admin_state_change`; before external worker automation, admin-facing override reason capture should be made explicit in the editor flow.

Model output cannot perform an override directly. A human or verified local worker must translate accepted advice into a CMS state change and event.

Opportunity conversion must remain human-reviewed until a separate automation rule is approved. Automated model advice may draft a response or fit reason, but it cannot mark an opportunity as responded, converted, ignored, or purged.
