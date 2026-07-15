---
"ceylonic": minor
---

Add `ceylonic/phone` (Sri Lankan phone number parsing/validation) and
`ceylonic/vehicle` (current-format vehicle registration plate
parsing/validation) modules, exported from the root entry point and as
independent subpath imports. Both follow the same never-throw,
result-object error-handling policy as `ceylonic/nic`.
