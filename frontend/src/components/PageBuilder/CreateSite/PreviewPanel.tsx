import { Box, Typography, styled, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TonePreview from "./TonePreview";
import { ColorScheme } from "./colorPaletteConstants";

const PreviewCard = styled(Box)(({ theme }) => ({
  background: "white",
  borderRadius: "24px",
  boxShadow: "0px 48px 100px 0px rgba(17, 12, 46, 0.15)",
  padding: "36px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  height: "100%",
  width: "100%",
  flexShrink: 0,
}));

const PreviewContent = styled(Box)({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  overflow: "hidden",
});

const PreviewHeader = styled(Box)({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
});

const PreviewTitle = styled(Typography)({
  fontFamily: '"General Sans", sans-serif',
  fontWeight: 600,
  fontSize: "16px",
  lineHeight: 1,
  letterSpacing: "-0.32px",
  color: "#565656",
});

const InfoIcon = styled(InfoOutlinedIcon)({
  fontSize: "16px",
  color: "#888888",
  cursor: "help",
  marginLeft: "6px",
});

const PreviewArea = styled(Box)({
  flex: "1 1 0",
  backgroundColor: "#efefef",
  borderRadius: "12px",
  width: "100%",
  minHeight: 0,
  overflow: "auto",
  display: "flex",
  alignItems: "stretch",
  justifyContent: "stretch",
});

interface PreviewPanelProps {
  selectedTone?: string;
  colors?: ColorScheme;
  backgroundImage?: string;
  fontFamily?: string;
}

const PreviewPanel = ({ selectedTone, colors, backgroundImage, fontFamily }: PreviewPanelProps) => {
  return (
    <PreviewCard>
      <PreviewContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", height: "100%", minHeight: 0 }}>
          <PreviewHeader>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <PreviewTitle>Preview Example</PreviewTitle>
              <Tooltip title="This is a sample website to show how your tone choice will look">
                <InfoIcon />
              </Tooltip>
            </Box>
          </PreviewHeader>
          <PreviewArea>
            {selectedTone ? (
              <TonePreview tone={selectedTone} colors={colors} backgroundImage={backgroundImage} fontFamily={fontFamily} />
            ) : (
              <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                width: "100%",
                height: "100%",
                color: "#999",
                fontSize: "14px"
              }}>
                Select a tone to preview
              </Box>
            )}
          </PreviewArea>
        </Box>
      </PreviewContent>
    </PreviewCard>
  );
};

export default PreviewPanel;

