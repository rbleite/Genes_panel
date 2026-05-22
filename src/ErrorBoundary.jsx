import React from "react";
import { AlertCircle, RefreshCcw, Copy, Check } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  state = { error: null, info: null, copied: false };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    if (typeof console !== "undefined") {
      console.error("[ErrorBoundary] Uncaught error in render tree:", error, info);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleCopy = async () => {
    const { error, info } = this.state;
    const payload = [
      `Erro: ${error?.name || "Error"}: ${error?.message || "(sem mensagem)"}`,
      "",
      "Stack:",
      error?.stack || "(stack indisponível)",
      "",
      "Component stack:",
      info?.componentStack || "(component stack indisponível)",
      "",
      `URL: ${window.location.href}`,
      `User-Agent: ${navigator.userAgent}`,
      `Timestamp: ${new Date().toISOString()}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(payload);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Clipboard unavailable — no-op; the details are visible on screen.
    }
  };

  render() {
    const { error, info, copied } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen w-full bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
              <div>
                <h1 className="text-base font-semibold text-rose-900">
                  Ocorreu um erro inesperado
                </h1>
                <p className="mt-1 text-sm text-rose-800">
                  A aplicação encontrou um problema e não pode continuar com segurança.
                  Tenta recarregar; se persistir, partilha os detalhes técnicos abaixo.
                </p>
              </div>
            </div>

            <div className="space-y-4 px-5 py-4 text-sm text-slate-700">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Mensagem
                </div>
                <pre className="mt-1 max-h-32 overflow-auto rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-800">
{(error?.name ? `${error.name}: ` : "") + (error?.message || "(sem mensagem)")}
                </pre>
              </div>

              {error?.stack && (
                <details>
                  <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-700">
                    Stack trace
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-100 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-700">
{error.stack}
                  </pre>
                </details>
              )}

              {info?.componentStack && (
                <details>
                  <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-700">
                    Componentes
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-100 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-700">
{info.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                Recarregar
              </button>
              <button
                type="button"
                onClick={this.handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    Copiar detalhes
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Esta ferramenta destina-se a apoio à decisão clínica. Em caso de erro,
            confirma sempre a recomendação por outras vias antes de validar o relatório.
          </p>
        </div>
      </div>
    );
  }
}
