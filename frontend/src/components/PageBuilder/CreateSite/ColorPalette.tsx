import { Box, styled } from "@mui/material";

const PaletteCard = styled(Box)<{ selected: boolean }>(({ selected }) => ({
  display: "flex",
  flexDirection: "column",
  cursor: "pointer",
  border: selected ? "2px solid #000" : "2px solid #e0e0e0",
  width: "100%",
  borderRadius: "10px",
  boxShadow: "0px 7px 29px 0px #64646F33",
  transition: "all 0.2s ease-out",
  "&:hover": {
    transform: "translateY(-2px)",
  },
}));

const ColorSwatches = styled(Box)({
  display: "flex"
});

const ColorSwatch = styled(Box)<{ color: string }>(({ color }) => ({
  flex: 1,
  aspectRatio: "1",
  backgroundColor: color,
  height: "30px",
  "&:first-of-type": {
    borderTopLeftRadius: "8px",
    borderBottomLeftRadius: "8px",
  },
  "&:last-child": {
    borderTopRightRadius: "8px",
    borderBottomRightRadius: "8px",
  },
}));

interface ColorPaletteProps {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  selected?: boolean;
  onClick?: () => void;
}

const ColorPalette = ({
  primary,
  secondary,
  accent,
  background,
  selected = false,
  onClick,
}: ColorPaletteProps) => {
  return (
    <PaletteCard selected={selected} onClick={onClick}>
      <ColorSwatches>
        <ColorSwatch color={primary} />
        <ColorSwatch color={secondary} />
        <ColorSwatch color={accent} />
        <ColorSwatch color={background} />
      </ColorSwatches>
    </PaletteCard>
  );
};

export default ColorPalette;

