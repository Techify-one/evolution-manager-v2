import React from "react";
import { Navigate } from "react-router-dom";

import { getToken, TOKEN_ID } from "@/lib/queries/token";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const apiUrl = getToken(TOKEN_ID.API_URL);
  const instanceToken = getToken(TOKEN_ID.INSTANCE_TOKEN);
  const instanceId = getToken(TOKEN_ID.INSTANCE_ID);
  const version = getToken(TOKEN_ID.VERSION);

  if (!apiUrl || !instanceToken || !instanceId || !version) {
    return <Navigate to="/manager/login" />;
  }

  return children;
};

export default ProtectedRoute;
