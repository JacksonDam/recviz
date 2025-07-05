import React, { memo, useState, useCallback, useMemo } from 'react';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Card from '@mui/material/Card';
import { styled } from '@mui/material/styles';

interface AttributeListProps {
  attributes: Record<string, unknown>;
}

const AttributeItem = memo(({
  attributeKey,
  value,
  isOpen,
  onToggle
}: {
  attributeKey: string;
  value: unknown;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <React.Fragment>
    <ListItemButton onClick={onToggle}>
      <ListItemText primary={attributeKey} style={{textWrap: "nowrap"}} />
      {isOpen ? <ExpandLess /> : <ExpandMore />}
    </ListItemButton>
    <Collapse in={isOpen} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        <ListItemButton sx={{ pl: 4 }}>
          <ListItemText primary={String(value)} style={{ wordWrap: 'break-word', overflowWrap: 'break-word', wordBreak: 'break-word'}} />
        </ListItemButton>
      </List>
    </Collapse>
  </React.Fragment>
));

AttributeItem.displayName = 'AttributeItem';

const StyledCard = styled(Card)(() => ({
  position: "absolute",
  top: "8px",
  right: "8px",
  zIndex: 1,
  width: "300px",
  display: 'flex',
  flexDirection: 'column',
  transition: 'max-height 0.3s ease-in-out',
  overflow: 'hidden',
}));

const AttributeList: React.FC<AttributeListProps> = ({ attributes }) => {
  if (!attributes || Object.keys(attributes).length === 0) {
    return null;
  }

  const items = useMemo(() => Object.keys(attributes), [attributes]);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [isListOpen, setIsListOpen] = useState(true);

  const handleItemToggle = useCallback((key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleListToggle = useCallback(() => {
    setIsListOpen(!isListOpen);
  }, [isListOpen]);

  return (
    <StyledCard style={{ maxHeight: isListOpen ? '300px' : '48px' }}>
      <ListSubheader component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Node Attributes ({items.length})</span>
        <IconButton onClick={handleListToggle} size="small">
          {isListOpen ? <ExpandMore /> : <ExpandLess />}
        </IconButton>
      </ListSubheader>
      <Collapse in={isListOpen} timeout="auto" unmountOnExit>
        <div style={{ maxHeight: 'calc(300px - 48px)', overflowY: 'auto' }}>
          <List dense>
            {items.map((key) => (
              <AttributeItem
                key={key}
                attributeKey={key}
                value={attributes[key]}
                isOpen={openItems[key] || false}
                onToggle={() => handleItemToggle(key)}
              />
            ))}
          </List>
        </div>
      </Collapse>
    </StyledCard>
  );
};

export default AttributeList;