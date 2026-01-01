import { registerActionsMetaBox } from "./actions";
import { registerAttachmentsMetaBox } from "./attachments";
import { registerContentMetaBox } from "./content";
import { registerCustomFieldsMetaBox } from "./customFields";
import { registerDownloadsMetaBox } from "./downloads";
import { registerGeneralMetaBox } from "./general";
import { registerMetadataMetaBox } from "./metadata";
import { registerPageTemplateMetaBox } from "./pageTemplate";
import { registerSeoMetaBox } from "./seo";
import { registerTaxonomyMetaBoxes } from "./taxonomy";
import { registerVimeoMetaBox } from "./vimeo";

let coreMetaBoxesRegistered = false;

export const registerCoreMetaBoxes = () => {
  if (coreMetaBoxesRegistered) {
    return;
  }

  const registrations: (() => void)[] = [
    registerGeneralMetaBox as unknown as () => void,
    registerContentMetaBox as unknown as () => void,
    registerCustomFieldsMetaBox as unknown as () => void,
    registerActionsMetaBox as unknown as () => void,
    registerMetadataMetaBox as unknown as () => void,
    registerPageTemplateMetaBox as unknown as () => void,
    registerAttachmentsMetaBox as unknown as () => void,
    registerDownloadsMetaBox as unknown as () => void,
    registerVimeoMetaBox as unknown as () => void,
    registerTaxonomyMetaBoxes as unknown as () => void,
    registerSeoMetaBox as unknown as () => void,
  ];

  for (const register of registrations) {
    register();
  }

  coreMetaBoxesRegistered = true;
};
