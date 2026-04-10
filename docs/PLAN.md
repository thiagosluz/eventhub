# Plan: Image Size Recommendations

Implement visual guides and recommendations for image uploads (Banner and Logo) in the event management dashboard to ensure high-quality visual identity.

## User Review Required

> [!IMPORTANT]
> **Recommended Sizes**:
> - **Banner**: 1920x1080px (16:9)
> - **Logo**: 512x512px (1:1)
> These sizes are standardized for high-definition displays and social sharing (OG).

## Proposed Changes

### Frontend: Event Management UI

#### [MODIFY] [page.tsx](file:///home/thiago/Projetos/eventhub/frontend/src/app/dashboard/events/[id]/page.tsx)
- **Banner Section**:
    - Add a small, discreet subtitle below "Banner Principal" with: "Comp: 1920x1080px (16:9). Formatos: JPG, PNG, WEBP."
    - Update the placeholder text inside the dropzone from "CLIQUE PARA ENVIAR" to include the size recommendation or a secondary line with the size.
- **Logo Section**:
    - Add a small subtitle below "Logo do Evento" with: "Sugestão: 512x512px (1:1)."
    - Update the placeholder icon area to include the recommendation.

## Open Questions

1. **Max File Size**: Should we also mention a maximum file size (e.g., "Máx: 2MB") to prevent slow loading times?

## Verification Plan

### Automated Tests
- Run `npm run lint` in frontend to ensure no regressions.

### Manual Verification
- Visual check of the management page to ensure the text is elegant and doesn't clutter the UI.
- Verify responsiveness of the new text on smaller screens.
