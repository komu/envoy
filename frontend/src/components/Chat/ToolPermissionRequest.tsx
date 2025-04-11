import {SendPermissionResponse, ToolPermissionRequestMessage} from "./useChatService.ts";
import {Button} from "./Button.tsx";

export function ToolPermissionRequest({request, onResponse}: {
  request: ToolPermissionRequestMessage,
  onResponse: SendPermissionResponse,
}) {
  const handleAllowOnce = () => onResponse(request.requestId, "AllowOnce");
  const handleAllowAlways = () => onResponse(request.requestId, "AllowAlways");
  const handleDeny = () => onResponse(request.requestId, "Deny");

  return (
    <div
      className="p-4 text-sm flex flex-col gap-4 items-center text-white  bg-secondary-bg rounded-lg animate-fade-in">
      <div>Envoy wants to use the tool <strong>{request.tool}</strong></div>

      <div className="flex flex-row gap-2">
        <Button onClick={handleAllowOnce}>Allow once</Button>
        <Button onClick={handleAllowAlways}>Allow for this chat</Button>
        <Button onClick={handleDeny}>Deny</Button>
      </div>
    </div>
  );
}
