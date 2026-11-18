# No backend: Progress lives in the browser

There are no accounts and no server. Progress is persisted in browser storage, with export and import as a JSON file for moving between devices. This keeps the Course a static site with zero running cost and no personal data to protect.

## Consequences

- All Progress access goes through a single repository interface. Swapping in a remote store later replaces one adapter, not its callers.
- Clearing site data loses Progress; export is the Learner's backup. The persisted shape is versioned so stored Progress can be migrated when it changes.
