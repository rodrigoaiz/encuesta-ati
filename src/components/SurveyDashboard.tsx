import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

type Answers = {
  Si: number;
  No: number;
};

type GradeData = {
  responses: number;
  answers: Record<string, Answers>;
};

type SurveyData = {
  meta: {
    validResponses: number;
    note: string;
    sourceFile: string;
  };
  questions: string[];
  overall: {
    responses: number;
    gradesDistribution: { name: string; value: number }[];
    answers: Record<string, Answers>;
  };
  byGrade: Record<string, GradeData>;
};

type Props = {
  data: SurveyData;
};

const YES_COLOR = '#4B785A';
const NO_COLOR = '#C65B28';
const DISTRIBUTION_COLOR = '#D7AE45';

const percent = (value: number, total: number) => {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};

const answerToChart = (answers: Answers) => [
  { name: 'Sí', value: answers.Si, fill: YES_COLOR },
  { name: 'No', value: answers.No, fill: NO_COLOR }
];

export default function SurveyDashboard({ data }: Props) {
  const gradeNames = useMemo(() => Object.keys(data.byGrade), [data.byGrade]);
  const [selectedGrade, setSelectedGrade] = useState<string>('Toda la escuela');

  const view = selectedGrade === 'Toda la escuela' ? data.overall : data.byGrade[selectedGrade];
  const responses = view.responses;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
      <section className="relative overflow-hidden rounded-3xl border border-ink/15 bg-paper/90 p-6 shadow-card backdrop-blur-sm sm:p-10">
        <div className="absolute -right-20 -top-24 h-52 w-52 rounded-full bg-gold/25 blur-2xl" />
        <div className="absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-ink/8 blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-4 rounded-2xl border border-gold/35 bg-white/75 p-4">
            <img
              src="/EscuelaHerminioAlmendrosLogo-Amarillo.png"
              alt="Logotipo de la Escuela Herminio Almendros"
              className="h-16 w-auto object-contain sm:h-20"
              loading="eager"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">Escuela</p>
              <h2 className="mt-1 text-xl font-bold text-ink sm:text-2xl">Herminio Almendros</h2>
              <p className="mt-1 text-base font-semibold text-ink sm:text-lg">Informe de resultados de encuesta ATI</p>
            </div>
          </div>
        </div>

        <div className="relative mt-6">
          <h1 className="max-w-4xl text-3xl font-bold leading-tight text-ink sm:text-5xl">
            Resultados de percepción sobre continuidad y pertinencia del temario
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink/75 sm:text-base">
            Explora los indicadores por grado o revisa la vista total de la escuela para comparar respuestas de forma clara.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-gold/45 bg-gold/18 px-3 py-1 text-xs font-semibold text-ink">
              Qué estás viendo: resultados por grado y consolidado general
            </span>
          </div>
        </div>

        <div className="relative mt-8 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-ink/10 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-ink/70">Respuestas válidas</p>
            <p className="mt-2 text-3xl font-bold text-ink">{data.meta.validResponses}</p>
          </article>
          <article className="rounded-2xl border border-gold/25 bg-gold/10 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-ink/70">Vista activa</p>
            <p className="mt-2 text-2xl font-bold text-ink">{selectedGrade}</p>
          </article>
          <article className="rounded-2xl border border-ink/10 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-ink/70">Registros en vista</p>
            <p className="mt-2 text-3xl font-bold text-ink">{responses}</p>
          </article>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-ink/15 bg-white/85 p-4 shadow-card sm:p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-ink/70">Filtro</p>
        <div className="flex flex-wrap gap-2">
          {['Toda la escuela', ...gradeNames].map((grade) => {
            const active = selectedGrade === grade;
            return (
              <button
                key={grade}
                type="button"
                onClick={() => setSelectedGrade(grade)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'border border-gold/60 bg-gold text-ink shadow-md'
                    : 'border border-ink/15 bg-paper text-ink hover:border-ink/40'
                }`}
              >
                {grade}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr,1fr]">
        <article className="rounded-3xl border border-ink/15 bg-white/85 p-4 shadow-card sm:p-6">
          <h2 className="text-xl font-bold text-ink">Distribución por grado</h2>
          <p className="mb-4 mt-1 text-sm text-ink/70">Solo para el consolidado escolar.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.overall.gradesDistribution}>
                <CartesianGrid strokeDasharray="4 5" stroke="#1D2A3A22" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill={DISTRIBUTION_COLOR} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-3xl border border-ink/15 bg-white/85 p-4 shadow-card sm:p-6">
          <h2 className="text-xl font-bold text-ink">Resumen rápido</h2>
          <p className="mb-3 mt-1 text-sm text-ink/70">{data.meta.note}</p>
          <ul className="space-y-2 text-sm text-ink/90">
            {data.questions.map((question) => {
              const ans = view.answers[question];
              const total = ans.Si + ans.No;
              return (
                <li key={question} className="rounded-xl border border-ink/10 bg-paper/70 p-3">
                  <p className="font-semibold">{question}</p>
                  <p className="mt-2">Sí: {ans.Si} ({percent(ans.Si, total)})</p>
                  <p>No: {ans.No} ({percent(ans.No, total)})</p>
                </li>
              );
            })}
          </ul>
        </article>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        {data.questions.map((question) => {
          const answers = view.answers[question];
          const chartData = answerToChart(answers);
          const total = answers.Si + answers.No;

          return (
            <article key={question} className="rounded-3xl border border-ink/15 bg-white/90 p-4 shadow-card sm:p-6">
              <h3 className="text-lg font-bold leading-snug text-ink">{question}</h3>
              <p className="mt-1 text-sm text-ink/70">Total evaluado: {total}</p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-moss/20 bg-moss/10 p-3">
                  <p className="font-semibold text-moss">Sí</p>
                  <p className="text-lg font-bold">{answers.Si}</p>
                  <p>{percent(answers.Si, total)}</p>
                </div>
                <div className="rounded-xl border border-ember/20 bg-ember/10 p-3">
                  <p className="font-semibold text-ember">No</p>
                  <p className="text-lg font-bold">{answers.No}</p>
                  <p>{percent(answers.No, total)}</p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <footer className="mt-10 border-t border-ink/15 pt-5 text-center text-sm text-ink/75">
        <span className="font-semibold text-ink/90">Creado por Comisión de tecnologías</span>
      </footer>
    </main>
  );
}
