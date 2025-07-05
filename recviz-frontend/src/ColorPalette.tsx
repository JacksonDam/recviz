import React, { useState } from 'react';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import TextField from '@mui/material/TextField';

const colors = [
  '#FF0000',
  '#ffd500',
  '#00bbff',
  '#a2ff00',
  '#e600ff',
  '#00eaff',
];

/* Adapted from mjackson, https://gist.github.com/mjackson/5311256 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  }
  else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  }
  else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  }
  else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  }
  else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  }
  else {
    r = c; g = 0; b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16)
    .slice(1)
    .toUpperCase();
}

/* Adapted from mjackson, https://gist.github.com/mjackson/5311256 */
function hexToRgb(hex: string) {
  hex = hex.replace(/^#/, '');
  if (hex.length !== 6) return null;
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

/* Adapted from mjackson, https://gist.github.com/mjackson/5311256 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0
  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hexToHue(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [h] = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return Math.round(h);
}

interface ColorPaletteProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onColorSelect: (color: string, closePopover?: boolean) => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({
  anchorEl,
  open,
  onClose,
  onColorSelect,
}) => {

  const [customActive, setCustomActive] = useState(false);
  const [customHue, setCustomHue] = useState(0);
  const [customHex, setCustomHex] = useState(hslToHex(0, 100, 50));

  const handleSliderChange = (event: Event, newValue: number | number) => {
    const hue = Array.isArray(newValue) ? newValue[0] : newValue;
    setCustomHue(hue);
    const newHex = hslToHex(hue, 100, 50);
    setCustomHex(newHex);
    onColorSelect(newHex, false);
  };

  const handleHexChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setCustomHex(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      const hue = hexToHue(value);
      setCustomHue(hue);
      onColorSelect(value, false);
    }
  };

  const handleCustomButtonClick = () => {
    setCustomActive(true);
    onColorSelect(customHex, false);
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      disableEnforceFocus={true}
      disableAutoFocus={true}
      disableRestoreFocus={true}
    >
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mb: customActive ? 2 : 0,
          }}
        >
          {colors.map((color) => (
            <Button
              key={color}
              onClick={() => onColorSelect(color, true)}
              sx={{
                minWidth: 24,
                width: 24,
                height: 24,
                padding: 0,
                borderRadius: '50%',
                backgroundColor: color,
                border: '1px solid #ccc',
              }}
            />
          ))}
          <Button
            onClick={handleCustomButtonClick}
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 1,
              backgroundColor: 'transparent',
              px: 1,
              height: 24,
              textTransform: 'none',
            }}
          >
            Custom
          </Button>
        </Box>

        {customActive && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="Hex"
              value={customHex}
              onChange={handleHexChange}
              size="small"
              sx={{ width: '100px' }}
            />
            <Slider
              min={0}
              max={360}
              value={customHue}
              onChange={handleSliderChange}
              sx={{ width: '200px' }}
            />
          </Box>
        )}
      </Box>
    </Popover>
  );
};

export default ColorPalette;
