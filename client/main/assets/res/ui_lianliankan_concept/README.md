# Lianliankan UI Concept Assets

Generated UI pieces for Cocos Creator composition.

## Files

- `bg_tabletop_park.png`: portrait gameplay background.
- `ui_atlas_source_magenta.png`: original generated atlas with chroma-key background.
- `ui_atlas_transparent.png`: transparent atlas.
- `slices_clean/`: recommended individual transparent PNGs.
- `slices_clean/01_panel_board_shadow.png`: separate soft shadow layer for the board.
- `slices_clean/01_panel_board_with_shadow.png`: board plus shadow combined for quick use.
- `preview_slices_clean_contact_sheet.jpg`: visual index of all slices.
- `preview_composed_example_clean.png`: example composition preview.
- `preview_panel_shadow_compare.jpg`: comparison of the original board and the shadowed board.

## Slice Map

1. `01_panel_board.png`
   - Shadow-only helper: `01_panel_board_shadow.png`
   - Combined helper: `01_panel_board_with_shadow.png`
2. `02_panel_top_status.png`
3. `03_button_primary_orange.png`
4. `04_button_secondary_mint.png`
5. `05_tile_base_blank.png`
6. `06_tile_selected_glow.png`
7. `07_line_connection_corner.png`
8. `08_badge_reward_star.png`
9. `09_tile_apple.png`
10. `10_tile_panda.png`
11. `11_tile_orange.png`
12. `12_tile_flower.png`
13. `13_icon_shuffle.png`
14. `14_icon_hint.png`
15. `15_icon_freeze_time.png`
16. `16_icon_score_star_coin.png`

## Cocos Notes

- Keep text as Cocos `Label` nodes, not baked into sprites.
- Use `05_tile_base_blank.png` as the reusable card background, then place tile icons above it.
- Use `06_tile_selected_glow.png` as an overlay when a card is selected.
- Use `03_button_primary_orange.png` for the main start/next button.
- Use `13`, `14`, and `15` for shuffle, hint, and freeze-time tool buttons.
