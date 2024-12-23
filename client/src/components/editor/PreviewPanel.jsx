import IframePreview from "@/components/IframePreview";
import LoaderCircle from "./LoaderCircle";
import Dice from "@/components/random/Dice";
import { useEffect } from "react";
import { useSelector } from "react-redux";

const PreviewPanel = ({
  currentView,
  currentDevice,
  iframeRef,
  isFileLoading,
  isDeploying,
  isUndoing,
  isRedoing,
  isCodeUpdating,
  isChatUpdating,
  shuffleDevice,
}) => {
  const isMobileView = currentView === "mobile";
  const { slug: shipSlug } = useSelector((state) => state.ship);

  return (
    <div className="h-full w-full overflow-hidden relative">
      {isMobileView ? (
        <div className="h-full w-full flex items-center justify-center">
          <div className="relative w-full h-full max-w-full max-h-full overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="transform-gpu"
                style={{ transform: "scale(0.85)" }}
              >
                <IframePreview
                  device={currentDevice}
                  ref={iframeRef}
                  slug={shipSlug}
                  currentView={currentView}
                  isLoading={isFileLoading}
                  isDeploying={isDeploying}
                />
              </div>
            </div>
            <div className="absolute bottom-4 right-4 z-10">
              <Dice onRoll={shuffleDevice} />
            </div>
          </div>
        </div>
      ) : (
        <IframePreview
          ref={iframeRef}
          slug={shipSlug}
          currentView={currentView}
          isLoading={isFileLoading}
          isDeploying={isDeploying}
        />
      )}
      {(isUndoing || isRedoing || isCodeUpdating || isChatUpdating) && (
        <LoaderCircle />
      )}
    </div>
  );
};

export default PreviewPanel;
