import { motion } from "framer-motion";

const FORM_URL = "https://forms.gle/brt36z223CPgE2Fx6";
const MANUAL_URL = "https://docs.google.com/document/d/1c1x2UzZjEionypuoH2QUHtlPHmmg9AC75N32mrhcpoo/edit?tab=t.0#heading=h.nmonqnhyef0l";

const Inscricoes = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-wider">Inscrições abertas - G.A.M.A</h1>
      </div>

      <motion.div
        className="space-y-5 rounded-xl border border-border bg-card p-6 text-sm leading-relaxed text-foreground/90"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p>
          Estão oficialmente abertas as inscrições para adentrar o Grupamento de Ações em Montanha e Ambientes
          Áridos (GAMA), unidade tática do 2BPM. Tendo foco em melhoria constante e união, a GAMA busca por
          oficiais que pensam em progressão de carreira, liderança e foco.
        </p>

        <ul className="list-disc space-y-1 pl-5">
          <li>Prova de conhecimento teórico</li>
          <li>TAF</li>
          <li>Análise de postura em situações habituais de cód. 0</li>
        </ul>

        <p>
          Estarão aptos ao estágio apenas aqueles que possuem a patente de <strong className="text-foreground">soldado</strong>,
          sendo <strong className="text-foreground">obrigatório realizar a prova de cabo</strong> mais próxima após a admissão na
          unidade. Agora são aceitos <strong className="text-foreground">soldados recém subidos</strong> (tendo um tempo de
          estágio prolongado).
        </p>

        <p>
          O formulário é apenas a primeira etapa até a efetivação, tendo em vista que após ser aprovado, o
          oficial deverá passar pelo <strong className="text-foreground">estágio prático</strong>.
        </p>

        <p className="font-semibold text-accent">
          👉🏼 Serão priorizados oficiais que tenham foco no horário noturno ou horários flexíveis que permitam a
          participação em no mínimo 1 ação grande na semana.
        </p>

        <p>
          Preencha o nosso{" "}
          <a href={FORM_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
            Formulário
          </a>{" "}
          com o auxílio do{" "}
          <a href={MANUAL_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-4 hover:underline">
            Manual de Conduta
          </a>
          .
        </p>

        <p className="border-t border-border pt-4 text-center italic text-muted-foreground">
          "A verdadeira evolução nasce do desafio aceito."
        </p>
      </motion.div>
    </div>
  );
};

export default Inscricoes;
