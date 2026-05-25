# Translation Contributor Workflow

## Pilot Structure

English content in `site/` remains the source of truth. Italian pilot articles are stored at the matching path under `translations/it/site/`.

```txt
site/Using_Zcash/Shielded_Pools.md
translations/it/site/Using_Zcash/Shielded_Pools.md
```

If a translated file is missing, the wiki application renders the English article at the Italian route. This lets contributors add translated articles incrementally.

## Adding Or Updating Italian Content

1. Start from the current English file in `site/`.
2. Create or update the matching `translations/it/site/...` file.
3. Keep links, image URLs, JSX/MDX markup, code, product names, and protected terms intact.
4. Run `node scripts/check-protected-terms.mjs`.
5. Request technical review and review from an Italian-speaking contributor.

AI-assisted drafts are acceptable starting points, but they are not publication-ready until an Italian-speaking reviewer approves accuracy, tone, links, formatting, and protected terminology.
The same terminology check runs automatically on pushes and pull requests that modify translated content, its source pages, or the terminology manifest.

## Protected Terms

The canonical validation list is `translation/protected-terms.json`. Terms listed in `preserveVerbatim` must remain unchanged wherever they occur in the English source. Proposed approved localizations must be discussed and added to the glossary before a translated page is merged.

## Pilot Pages

- `Using_Zcash/Wallets.md`
- `Using_Zcash/Shielded_Pools.md`
- `Zcash_Community/Arborist_Calls.md`
- `Zcash_Tech/zk_SNARKS.md`

Additional Italian pages can use the same directory convention after the pilot is reviewed.
