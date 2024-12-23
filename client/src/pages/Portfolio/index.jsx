import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortfolioBuilder from "@/components/portfolio-builder/PortfolioBuilder";
import { AuthContext } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import {
  getLatestShipIdForUser,
  getLatestShipInfoForUser,
} from "@/lib/utils/editorUtils";
import Lottie from "react-lottie-player";
import shipAnimation from "@/assets/lottie/ship.json";
import LoginForm from "@/components/LoginForm";
import { toast } from "sonner";

const Portfolio = () => {
  const navigate = useNavigate();
  const { user, userLoading, handleLogin } = useContext(AuthContext);
  const [isCheckingProject, setIsCheckingProject] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const checkExistingProject = async () => {
      if (!userLoading && user) {
        try {
          const latestShipInfo = await getLatestShipInfoForUser(user.id);
          if (latestShipInfo) {
            navigate("/editor", {
              state: {
                shipId: latestShipInfo.id,
                shipSlug: latestShipInfo.slug,
              },
            });
          } else {
            setIsCheckingProject(false);
          }
        } catch (error) {
          console.error("Error checking for existing project:", error);
          setIsCheckingProject(false);
        }
      } else if (!userLoading) {
        setIsCheckingProject(false);
      }
    };

    checkExistingProject();
  }, [user, userLoading, navigate]);

  const handleLoginSubmit = async (email, password) => {
    setIsLoggingIn(true);
    const result = await handleLogin(email, password);
    if (result.success) {
      try {
        const latestShipInfo = await getLatestShipInfoForUser(result.user.id);
        if (latestShipInfo) {
          navigate("/editor", {
            state: { shipId: latestShipInfo.id, shipSlug: latestShipInfo.slug },
          });
        } else {
          setIsLoggingIn(false);
        }
      } catch (error) {
        console.error(
          "Error checking for existing project after login:",
          error
        );
        setIsLoggingIn(false);
      }
    } else {
      toast.error("Unable to proceed", {
        description: result.message,
      });
      setIsLoggingIn(false);
    }
  };

  if (userLoading || isCheckingProject || isLoggingIn) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <Lottie
            animationData={shipAnimation}
            style={{ width: 200, height: 200 }}
            loop={true}
            play={true}
          />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <LoginForm onSubmit={handleLoginSubmit} isLoading={isLoggingIn} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PortfolioBuilder />
    </AppLayout>
  );
};

export default Portfolio;
