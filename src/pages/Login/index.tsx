import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormInput } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { verifyInstanceKey } from "@/lib/queries/auth/verifyInstanceKey";
import { verifyServer } from "@/lib/queries/auth/verifyServer";
import { logout, saveToken } from "@/lib/queries/token";
import { useTheme } from "@/components/theme-provider";

const loginSchema = z.object({
  serverUrl: z.string({ required_error: "serverUrl is required" }).url("URL inválida"),
  apiKey: z.string({ required_error: "ApiKey is required" }),
});
type LoginSchema = z.infer<typeof loginSchema>;

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [searchParams] = useSearchParams();
  const hasAttemptedAutoLogin = useRef(false);

  const loginForm = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      serverUrl: window.location.protocol + "//" + window.location.host,
      apiKey: "",
    },
  });

  const handleLogin: SubmitHandler<LoginSchema> = async (data) => {
    const server = await verifyServer({ url: data.serverUrl });

    if (!server || !server.version) {
      logout();
      loginForm.setError("serverUrl", {
        type: "manual",
        message: t("login.message.invalidServer"),
      });
      return;
    }

    const validation = await verifyInstanceKey({
      apikey: data.apiKey,
      url: data.serverUrl,
    });

    if (!validation.isValid) {
      if (validation.isGlobalKey) {
        loginForm.setError("apiKey", {
          type: "manual",
          message: t("login.message.globalKeyDetected"),
        });
      } else {
        loginForm.setError("apiKey", {
          type: "manual",
          message: t("login.message.invalidCredentials"),
        });
      }
      return;
    }

    if (!validation.instance) {
      loginForm.setError("apiKey", {
        type: "manual",
        message: t("login.message.noInstanceFound"),
      });
      return;
    }

    saveToken({
      version: server.version,
      clientName: server.clientName,
      url: data.serverUrl,
      token: validation.instance.token,
      instanceId: validation.instance.id,
      instanceName: validation.instance.name,
    });

    navigate(`/manager/instance/${validation.instance.id}/dashboard`);
  };

  // Magic link auto-login: Check URL parameters
  useEffect(() => {
    if (hasAttemptedAutoLogin.current) return;

    const serverUrlParam = searchParams.get("serverUrl");
    const apiKeyParam = searchParams.get("apiKey");

    if (serverUrlParam && apiKeyParam) {
      hasAttemptedAutoLogin.current = true;
      
      // Set form values
      loginForm.setValue("serverUrl", serverUrlParam);
      loginForm.setValue("apiKey", apiKeyParam);

      // Auto-submit the form
      loginForm.handleSubmit(handleLogin)();
    }
  }, [searchParams, loginForm]);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-center pt-2">
        <img className="h-10" src={theme === "dark" ? "https://evolution-api.com/files/evo/evolution-logo-white.svg" : "https://evolution-api.com/files/evo/evolution-logo.svg"} alt="logo" />
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <Card className="b-none w-[350px] shadow-none">
          <CardHeader>
            <CardTitle className="text-center">{t("login.title")}</CardTitle>
            <CardDescription className="text-center">{t("login.description")}</CardDescription>
          </CardHeader>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)}>
              <CardContent>
                <div className="grid w-full items-center gap-4">
                  <FormInput required name="serverUrl" label={t("login.form.serverUrl")}>
                    <Input />
                  </FormInput>
                  <FormInput required name="apiKey" label={t("login.form.apiKey")}>
                    <Input type="password" />
                  </FormInput>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button className="w-full" type="submit">
                  {t("login.button.login")}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
      <Footer />
    </div>
  );
}

export default Login;
