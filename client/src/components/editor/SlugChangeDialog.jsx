import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setShipInfo } from "@/store/shipSlice";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useProject } from "@/hooks/useProject";

const SlugChangeDialog = ({ open, onOpenChange }) => {
  const dispatch = useDispatch();
  const shipInfo = useSelector((state) => state.ship);
  const [newSlug, setNewSlug] = useState("");
  const [isChangingSlug, setIsChangingSlug] = useState(false);
  const { changeSlug } = useProject(shipInfo.slug);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    setPreviewUrl(
      `${import.meta.env.VITE_MAIN_URL}/site/${newSlug || shipInfo.slug}/`
    );
  }, [newSlug, shipInfo.slug]);

  const handleSlugChange = async () => {
    setIsChangingSlug(true);
    try {
      const response = await changeSlug(shipInfo.id, shipInfo.slug, newSlug);
      if (response.success) {
        dispatch(setShipInfo({ ...shipInfo, slug: newSlug }));
        toast.success("Slug changed successfully");
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error changing slug:", error);
      if (error.response && error.response.status === 400) {
        toast.error("This slug is already in use. Please try another one.");
      } else {
        toast.error("Failed to change slug. Please try again later.");
      }
    } finally {
      setIsChangingSlug(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Slug</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter a new slug for your project. This will change the URL of your
            website.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="slug" className="text-right text-foreground">
              Slug
            </Label>
            <Input
              id="slug"
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              placeholder="Enter new slug"
              className="col-span-3 text-foreground"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-foreground">Preview</Label>
            <div className="col-span-3 text-sm break-all text-muted-foreground">
              {previewUrl}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-foreground"
          >
            Cancel
          </Button>
          <Button onClick={handleSlugChange} disabled={isChangingSlug}>
            {isChangingSlug ? "Changing..." : "Change Slug"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SlugChangeDialog;
