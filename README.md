# Autopilot Control Plane

Autopilot is the governance and orchestration control plane for supervised project delivery.

It owns:

- project architecture registry and work-log standards
- delivery workflow rules and governance gates
- prompt packs, plans, specs, and run logs
- sanitized project snapshots used as audit evidence

It does not own product runtime code. Product repositories such as `SirRadek/radeq` must live in separate local roots outside this control-plane repository.

Configure the product repository root with `AUTOPILOT_PROJECTS_ROOT`:

```powershell
$env:AUTOPILOT_PROJECTS_ROOT = "C:\Users\sirok\Documents\Projects"
```

```sh
export AUTOPILOT_PROJECTS_ROOT="$HOME/Projects"
```

The Windows path above is the current local example, not a hardcoded requirement.

Canonical repository: `SirRadek/autopilot`
