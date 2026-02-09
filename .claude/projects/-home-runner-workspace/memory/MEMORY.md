# Mien Kingdom App - Key Patterns

## Asset Paths
- Images in `assets/images/` (root level, NOT inside `client/`)
- The `@/` alias maps to `client/` directory
- From `client/screens/`, use relative path `../../assets/images/` for root assets
- Some assets use `@/assets/` which resolves to `client/assets/` (different from root `assets/`)
- HomeScreen pattern: `require("../../assets/images/background-top-transparent.png")`

## Theme Pattern (Home Page Standard)
- Background color: `isDark ? "#1a1a1a" : "#F5EDD8"` (warm cream light, dark gray dark)
- Decorative top pattern: `background-top-transparent.png` (absolute positioned, 180px height, zIndex: 0)
- Decorative bottom pattern: `background-bottom-transparent.png` (absolute positioned, 160px height, zIndex: 0)
- Content (ScrollView/FlatList) needs `zIndex: 1` to render above background images
- Old pattern used `ImageBackground` with `mien-pattern.png` + semi-transparent overlay - replaced with new theme

## Subscription Tiers
- Config in `shared/tier-config.ts` AND duplicated in `client/screens/SubscriptionScreen.tsx` TIERS array
- Changes to pricing/features must be updated in BOTH files
