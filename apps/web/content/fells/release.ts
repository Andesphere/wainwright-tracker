// The fell pages Google may index, in release order. Every other fell page
// builds as noindex and stays out of the sitemap. Batch 1 (#31) is the 20 with
// the most search demand (decision #19), none of them on the walker-check list
// (#47). Later batches wait for the gates in #32.

export const RELEASED_FELLS = [
  "scafell-pike",
  "helvellyn",
  "catbells",
  "skiddaw",
  "loughrigg-fell",
  "latrigg",
  "walla-crag",
  "great-gable",
  "helm-crag",
  "hallin-fell",
  "castle-crag",
  "rannerdale-knotts",
  "scafell",
  "green-gable",
  "gowbarrow-fell-wainwright-summit",
  "red-screes",
  "binsey",
  "fleetwith-pike",
  "grisedale-pike",
  "bowfell",
] as const;
