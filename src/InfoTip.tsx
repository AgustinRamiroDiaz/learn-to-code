import type { ReactNode } from "react";
import {
  Button,
  OverlayArrow,
  Tooltip,
  TooltipTrigger,
} from "react-aria-components";

type InfoTipProps = {
  label: string;
  children: ReactNode;
};

export default function InfoTip({ label, children }: InfoTipProps) {
  return (
    <TooltipTrigger delay={250} closeDelay={100}>
      <Button className="react-aria-Button iconButton" aria-label={label}>
        ?
      </Button>
      <Tooltip className="react-aria-Tooltip appTooltip">
        <OverlayArrow>
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
            <path d="M0 0 L4 4 L8 0" />
          </svg>
        </OverlayArrow>
        {children}
      </Tooltip>
    </TooltipTrigger>
  );
}
