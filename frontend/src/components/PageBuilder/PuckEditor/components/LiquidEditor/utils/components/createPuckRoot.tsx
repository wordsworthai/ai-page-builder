import { ReactNode, useContext, useMemo } from "react";
import { DefaultRootProps, renderContext } from "@measured/puck";

export type RootProps = {
  children: ReactNode;
  title: string;
} & DefaultRootProps;

export interface PageStructureInfo {
  page_type: string;
  header_unique_ids?: string[];
  body_unique_ids?: string[];
  footer_unique_ids?: string[];
}

/** Zone names for the structural page model: Header | Sections | Footer */
export const ROOT_ZONES = {
  header: "header",
  sections: "default-zone", // root:default-zone uses data.content
  footer: "footer",
} as const;

export const ROOT_ZONE_COMPOUNDS = {
  header: "root:header",
  sections: "root:default-zone",
  footer: "root:footer",
} as const;

function isInList(id: string, list: string[] | undefined): boolean {
  return Array.isArray(list) && list.includes(id);
}

function Root({ children, puck }: RootProps) {
  const { config, data } = useContext(renderContext);
  const root = data?.root as { props?: { page_structure_info?: PageStructureInfo }; page_structure_info?: PageStructureInfo } | undefined;
  // Get the page structure info from the root object. When creating puck editor 
  // in file editorDataProvider.tsx, page structure info is passed as a prop to the root object.
  const pageStructureInfo = root?.props?.page_structure_info ?? root?.page_structure_info;
  const DropZone = puck?.renderDropZone;

  const { headerKeys, footerKeys } = useMemo(() => {
    const components = config?.components ?? {};
    const header: string[] = [];
    const footer: string[] = [];

    if (pageStructureInfo) {
      for (const [key] of Object.entries(components)) {
        const sectionId = key.replace(/^LIQUID__/, "");
        if (isInList(sectionId, pageStructureInfo.header_unique_ids)) header.push(key);
        if (isInList(sectionId, pageStructureInfo.footer_unique_ids)) footer.push(key);
      }
    }
    return { headerKeys: header, footerKeys: footer };
  }, [config, pageStructureInfo]);

  if (!DropZone) {
    return <>{children}</>;
  }
  return (
    <>
      <DropZone zone={ROOT_ZONES.header} allow={headerKeys} />
      {children}
      <DropZone zone={ROOT_ZONES.footer} allow={footerKeys} />
    </>
  );
}

export default Root;