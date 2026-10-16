import { Info, ShieldCheck } from "lucide-react";
import Modal from "./Modal.jsx";

const REPO = "https://github.com/rbleite/Genes_panel";

function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h3 className="mb-1.5 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="text-sm leading-6 text-slate-700">{children}</div>
    </section>
  );
}

export default function AboutPrivacyModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Acerca e privacidade" icon={Info}>
      <Section title="Responsável">
        Desenvolvida por Ricardo B. Leite, Patologia Molecular — Serviço de Anatomia Patológica,
        ULS Almada-Seixal. Código-fonte público e auditável em{" "}
        <a href={REPO} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-600">
          github.com/rbleite/Genes_panel
        </a>{" "}
        (licença Apache 2.0).
      </Section>

      <Section title="Finalidade">
        Catálogo dos painéis NGS do serviço e apoio à escolha do painel adequado a cada contexto
        clínico, com base no documento institucional de selecção de painéis. É uma ferramenta de
        apoio e de formação: não substitui o juízo clínico, a discussão multidisciplinar nem a
        validação laboratorial.
      </Section>

      <Section title="Alojamento">
        Plataforma Vercel, externa à infraestrutura informática da ULS Almada-Seixal. As consultas
        de evidência são processadas por funções Vercel alojadas nos EUA.
      </Section>

      <Section title="Dados pessoais">
        <ul className="ml-1 space-y-1.5">
          {[
            "Não tem autenticação nem recolhe credenciais.",
            "Não recolhe, não armazena e não transmite dados de doentes; não tem base de dados.",
            "Não usa cookies nem estatísticas de utilização.",
            "O browser guarda localmente apenas o último painel seleccionado.",
            "A consulta opcional de evidência envia às bases públicas CIViC e OncoKB apenas o símbolo do gene, a alteração e o tipo tumoral.",
            "Como qualquer servidor web, a plataforma de alojamento regista dados técnicos dos pedidos (por exemplo, endereço IP e página pedida).",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <ShieldCheck className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" aria-hidden="true" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          Não introduza dados identificativos de doentes em nenhum campo.
        </p>
      </Section>

      <Section title="Contacto">
        Serviço de Anatomia Patológica — Patologia Molecular, ULS Almada-Seixal.
      </Section>
    </Modal>
  );
}
