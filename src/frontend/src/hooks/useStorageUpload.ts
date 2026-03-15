import { HttpAgent } from "@icp-sdk/core/agent";
import { useCallback, useState } from "react";
import { loadConfig } from "../config";
import { StorageClient } from "../utils/StorageClient";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useStorageUpload() {
  const { identity } = useInternetIdentity();
  const { actor } = useActor();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = useCallback(
    async (file: File): Promise<string> => {
      if (!identity) {
        throw new Error("Pehle login karein taaki photo upload ho sake");
      }
      setIsUploading(true);
      setUploadProgress(0);
      try {
        // Ensure user is registered in access control
        if (actor) {
          try {
            await actor._initializeAccessControlWithSecret("");
          } catch {
            // Ignore - user may already be registered
          }
        }
        const config = await loadConfig();
        const agent = new HttpAgent({
          host: config.backend_host,
          identity: identity,
        });
        if (config.backend_host?.includes("localhost")) {
          await agent.fetchRootKey();
        }
        const storageClient = new StorageClient(
          config.bucket_name,
          config.storage_gateway_url,
          config.backend_canister_id,
          config.project_id,
          agent,
        );
        const bytes = new Uint8Array(await file.arrayBuffer());
        const { hash } = await storageClient.putFile(bytes, (pct) => {
          setUploadProgress(pct);
        });
        const url = await storageClient.getDirectURL(hash);
        return url;
      } finally {
        setIsUploading(false);
      }
    },
    [identity, actor],
  );

  return { uploadImage, isUploading, uploadProgress };
}
