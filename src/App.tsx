import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  Download,
  GraduationCap,
  Menu,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react"

import heroImg from "./assets/pp-compres.png"
import resumePdf from "./assets/resume.pdf"
import { Button } from "@/components/ui/button"

type BlogPost = {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  readingTime: string
  content: string
}

const markdownFiles = import.meta.glob<string>("./content/blog/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
})

const navItems = [
  { label: "Home", href: "/" },
  { label: "Project", href: "/project" },
  { label: "Blog", href: "/blog" },
]

const experiences = [
  {
    role: "AI Engineer (Backend)",
    company: "Regene Genomics",
    period: "2024 - Now",
    description:
      "Led end-to-end development of a health chatbot using RAG and AI Agent, serving 200+ daily users and reducing response time by 10%. Designed MongoDB replication and sharding architecture, fine-tuned LLM on 280k+ health records, optimized vector search latency by 65–75%, and built 3+ Dockerized FastAPI microservices.",
  },
  {
    role: "Machine Learning Freelance",
    company: "Fastwork.id",
    period: "2024 - 2025",
    description:
      "Completed 7+ client machine learning projects, including LangChain chatbot for freelance project recommendations, TensorFlow acne detection model, Streamlit sentiment dashboard, and NLP models using Naive Bayes, Gemini API, BERT, and Gensim.",
  },
  {
    role: "Software Developer",
    company: "PT Disi Solusi Mandiri",
    period: "2023 - 2024",
    description:
      "Redesigned marketing website, increasing leads/traffic by 10% in 3 months. Built 10+ REST APIs for CRM integration, reduced invoice processing by 60%, developed CRM modules, automated scheduling, and managed production MySQL database.",
  },
  {
    role: "IT Support",
    company: "PT Disi Solusi Mandiri",
    period: "2022 - 2023",
    description:
      "Managed MySQL databases and provided technical IT support for daily office operations. Also developed a website chatbot and internal office management application as self-initiated projects, while supporting online/offline training sessions as a moderator and assisting walk-in website visitors.",
  },
]

const educations = [
  {
    school: "Bangkit Academy by Google",
    major: "Machine Learning Cohort",
    period: "2024 - 2024",
    description:
      "Completed intensive machine learning training covering Python, TensorFlow, data processing, model development, and deployment, with hands-on projects focused on solving real-world problems using AI.",
  },
  {
    school: "Pelita Bangsa University",
    major: "Informatics Engineering",
    period: "2021 - 2025",
    description:
      "I am an Employee Student taking weekend classes majoring in Informatics Engineering at Pelita Bangsa University. I focus on Machine Learning and AI, because those fields make my curiosity about the world of technology increase.",
  },
]

const certifications = [
  { title: "Machine Learning Specialization", href: "https://www.coursera.org/account/accomplishments/specialization/66XCHLZAAEMU" },
  { title: "Mathematics for Machine Learning and Data Science Specialization", href: "https://www.coursera.org/account/accomplishments/specialization/Q2GXP7YAEJAY" },
  { title: "TensorFlow Developer Professional Certificate", href: "https://www.coursera.org/account/accomplishments/specialization/NNFGJKM7SYGS" },
  { title: "TensorFlow: Data and Deployment Specialization", href: "https://www.coursera.org/account/accomplishments/specialization/DZ5QURDCK76L" },
  { title: "TensorFlow: Advanced Techniques Specialization", href: "https://www.coursera.org/account/accomplishments/specialization/KHN6QUWPE5MS" },
]

const projects = [
  {
    title: "Healthy Chatbot",
    type: "AI and Machine Learning",
    visibility: "Public",
    href: "#",
    description:
      "RAG-based health chatbot system to provide accurate medical responses",
    stack: ["Python", "RAG", "Vector Search", "Streamlit"],
  },
  {
    title: "Book Recommendation",
    type: "Recommendation System",
    visibility: "Public",
    href: "#",
    description:
      "Creating a recommendation system using AI by leveraging user interactions in mobile applications",
    stack: ["Python", "Tensorflow", "PyTorch", "Scikit Learn"],
  },
  {
    title: "Landing Page Disi Training Center",
    type: "Web Development",
    visibility: "Public",
    href: "https://disi.co.id/",
    description:
      "Training web landing page for HSE and Hospitals using Wordpress, Elementor, SEO and other tools",
    stack: ["Wordpress", "Elementor", "SEO"],
  },
  {
    title: "Healthcare Chatbot Service and Embedding Service",
    type: "Chatbot Health Care System",
    visibility: "Private",
    href: "#",
    description:
      "Backend system for health chatbot integrated with DNA data and Embedding Service",
    stack: ["Python", "FineTuning", "FastAPI", "LLM", "Vector Search", "PostgreSQL", "MongoDB"],
  },
  {
    title: "Subscribtion System",
    type: "Subscribtion",
    visibility: "Private",
    href: "#",
    description:
      "Dynamic customer management application with a one-time payment system for a certain period or quota",
    stack: ["Golang", "Fiber", "MongoDB", "Docker", "Linux"],
  },
  {
    title: "Group and Community Management System",
    type: "Group and Community",
    visibility: "Private",
    href: "#",
    description:
      "Application for community group system management and posting such as like, comment, share.",
    stack: ["Golang", "Fiber", "MongoDB", "Docker", "Linux"],
  },
]

function parseFrontmatter(raw: string, slug: string): BlogPost {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  const data: Record<string, string> = {}
  const body = match?.[2]?.trim() ?? raw.trim()

  match?.[1].split(/\r?\n/).forEach((line) => {
    const separatorIndex = line.indexOf(":")

    if (separatorIndex === -1) {
      return
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    data[key] = value.replace(/^["']|["']$/g, "")
  })

  const tags =
    data.tags
      ?.replace(/^\[|\]$/g, "")
      .split(",")
      .map((tag) => tag.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean) ?? []

  const wordCount = body.split(/\s+/).filter(Boolean).length
  const readingTime = `${Math.max(1, Math.ceil(wordCount / 180))} min read`

  return {
    slug,
    title: data.title ?? slug.replaceAll("-", " "),
    date: data.date ?? "2026-01-01",
    excerpt: data.excerpt ?? "",
    tags,
    readingTime,
    content: body,
  }
}

function getBlogPosts() {
  return Object.entries(markdownFiles)
    .map(([path, raw]) => {
      const slug = path.split("/").pop()?.replace(".md", "") ?? "post"
      return parseFrontmatter(raw, slug)
    })
    .sort(
      (a, b) => parseDateValue(b.date) - parseDateValue(a.date),
    )
}

function navigateTo(path: string) {
  window.history.pushState({}, "", path)
  window.dispatchEvent(new PopStateEvent("popstate"))
  window.scrollTo({ top: 0, behavior: "smooth" })
}

function AppLink({
  href,
  children,
  className,
  onNavigate,
}: {
  href: string
  children: ReactNode
  className?: string
  onNavigate?: () => void
}) {
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return
        }

        event.preventDefault()
        navigateTo(href)
        onNavigate?.()
      }}
    >
      {children}
    </a>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-zinc-400">{description}</p>
      ) : null}
    </div>
  )
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.52 2.87 8.35 6.84 9.7.5.09.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.92c.85 0 1.7.12 2.5.34 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.59.69.49A10.16 10.16 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z" />
    </svg>
  )
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M5.37 3.5a2.38 2.38 0 1 1 0 4.75 2.38 2.38 0 0 1 0-4.75ZM3.46 9.48h3.82V20.5H3.46V9.48Zm6.11 0h3.66v1.51h.05c.51-.96 1.75-1.98 3.61-1.98 3.86 0 4.57 2.54 4.57 5.85v5.64h-3.82v-5c0-1.19-.02-2.73-1.66-2.73-1.67 0-1.93 1.3-1.93 2.65v5.08H9.57V9.48Z" />
    </svg>
  )
}

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M12.04 2a9.82 9.82 0 0 0-8.35 15L2.5 21.5l4.61-1.17A9.96 9.96 0 0 0 12.04 21 9.58 9.58 0 0 0 22 11.5 9.58 9.58 0 0 0 12.04 2Zm0 17.36a8.22 8.22 0 0 1-4.19-1.14l-.3-.18-2.73.69.72-2.61-.2-.32a8.16 8.16 0 1 1 6.7 3.56Zm4.5-6.1c-.25-.12-1.47-.71-1.7-.8-.23-.08-.39-.12-.56.12-.16.24-.64.8-.78.96-.15.16-.29.18-.54.06-.25-.12-1.05-.38-2-1.21-.74-.64-1.24-1.43-1.38-1.67-.15-.24-.02-.37.11-.49.11-.11.25-.28.37-.42.12-.14.16-.24.25-.4.08-.16.04-.3-.02-.42-.06-.12-.56-1.32-.76-1.81-.2-.47-.41-.41-.56-.42h-.47c-.16 0-.43.06-.66.3-.23.24-.86.82-.86 2s.88 2.32 1 2.48c.12.16 1.73 2.59 4.2 3.63.59.25 1.05.4 1.41.51.59.18 1.13.16 1.55.1.47-.07 1.47-.59 1.68-1.16.21-.57.21-1.06.15-1.16-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  )
}

type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; language: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "paragraph"; text: string }

function MarkdownContent({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content)
  const [copiedCodeBlock, setCopiedCodeBlock] = useState<number | null>(null)

  async function copyCodeBlock(code: string, index: number) {
    await navigator.clipboard.writeText(code)
    setCopiedCodeBlock(index)
    window.setTimeout(() => setCopiedCodeBlock(null), 1600)
  }

  return (
    <div className="space-y-6 text-zinc-300">
      {blocks.map((block, index) => {
        if (block.type === "heading" && block.level === 3) {
          return (
            <h3 key={index} className="pt-4 text-2xl font-semibold text-white">
              {renderInline(block.text)}
            </h3>
          )
        }

        if (block.type === "heading" && block.level === 2) {
          return (
            <h2 key={index} className="pt-6 text-3xl font-semibold text-white">
              {renderInline(block.text)}
            </h2>
          )
        }

        if (block.type === "heading" && block.level === 1) {
          return (
            <h1 key={index} className="text-4xl font-semibold text-white">
              {renderInline(block.text)}
            </h1>
          )
        }

        if (block.type === "list") {
          return (
            <ul key={index} className="space-y-3 pl-5">
              {block.items.map((item) => (
                <li key={item} className="list-disc leading-8 marker:text-cyan-300">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          )
        }

        if (block.type === "code") {
          return (
            <div key={index} className="relative rounded-xl border border-white/10 bg-black/40">
              <button
                type="button"
                className="absolute right-3 top-3 inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/10 text-zinc-300 transition hover:bg-white/15 hover:text-white"
                aria-label="Copy code"
                title="Copy code"
                onClick={() => void copyCodeBlock(block.code, index)}
              >
                {copiedCodeBlock === index ? (
                  <Check className="size-4 text-emerald-300" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
              <pre className="overflow-x-auto p-5 pr-16 text-sm leading-7 text-zinc-200">
                <code className={`language-${block.language || "text"}`}>{block.code}</code>
              </pre>
            </div>
          )
        }

        if (block.type === "table") {
          return (
            <div key={index} className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="bg-white/10 text-cyan-100">
                  <tr>
                    {block.headers.map((header) => (
                      <th key={header} className="border-b border-white/10 px-4 py-3 font-semibold">
                        {renderInline(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {block.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="bg-black/20">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-3 leading-7 text-zinc-300">
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        return (
          <p key={index} className="text-lg leading-9">
            {renderInline(block.text)}
          </p>
        )
      })}
    </div>
  )
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n")
  const blocks: MarkdownBlock[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    const codeFenceMatch = trimmed.match(/^```(\w*)$/)
    if (codeFenceMatch) {
      const codeLines: string[] = []
      index += 1

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index])
        index += 1
      }

      if (index < lines.length) {
        index += 1
      }

      blocks.push({
        type: "code",
        language: codeFenceMatch[1],
        code: codeLines.join("\n"),
      })
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3,
        text: headingMatch[2],
      })
      index += 1
      continue
    }

    if (isMarkdownTableStart(lines, index)) {
      const tableLines: string[] = []

      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        tableLines.push(lines[index])
        index += 1
      }

      const [headerLine, , ...rowLines] = tableLines
      blocks.push({
        type: "table",
        headers: splitTableRow(headerLine),
        rows: rowLines.map(splitTableRow),
      })
      continue
    }

    if (trimmed.startsWith("- ")) {
      const items: string[] = []

      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().replace(/^- /, ""))
        index += 1
      }

      blocks.push({ type: "list", items })
      continue
    }

    const paragraphLines: string[] = []

    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("```") &&
      !lines[index].trim().match(/^(#{1,3})\s+/) &&
      !lines[index].trim().startsWith("- ") &&
      !isMarkdownTableStart(lines, index)
    ) {
      paragraphLines.push(lines[index].trim())
      index += 1
    }

    blocks.push({
      type: "paragraph",
      text: paragraphLines.join(" "),
    })
  }

  return blocks
}

function isMarkdownTableStart(lines: string[], index: number) {
  return Boolean(
    lines[index]?.includes("|") &&
      lines[index + 1]
        ?.trim()
        .split("|")
        .filter(Boolean)
        .every((cell) => /^:?-{3,}:?$/.test(cell.trim())),
  )
}

function splitTableRow(row: string) {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g)

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      )
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-sm text-cyan-100"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)

    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          className="font-medium text-cyan-200 underline underline-offset-4"
          target={linkMatch[2].startsWith("http") ? "_blank" : undefined}
          rel={linkMatch[2].startsWith("http") ? "noreferrer" : undefined}
        >
          {linkMatch[1]}
        </a>
      )
    }

    return part
  })
}

function Layout({ path, children }: { path: string; children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#07090f] pt-16 text-zinc-100">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07090f]/85 backdrop-blur-xl">
        <nav className="mx-auto flex w-full max-w-6xl flex-col px-5 py-3 md:h-16 md:flex-row md:items-center md:justify-between md:py-0">
          <div className="flex w-full items-center justify-between md:w-auto">
            <AppLink
              href="/"
              className="min-w-0 truncate font-semibold"
              onNavigate={() => setMobileMenuOpen(false)}
            >
              <span>Gufranaka Samudra</span>
            </AppLink>

            <Button
              variant="outline"
              size="icon"
              className="cursor-pointer rounded-lg border-white/20 bg-white/10 text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/15 active:translate-y-0 md:hidden"
              aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>

          <div className="hidden items-center justify-center gap-1 rounded-full border border-white/10 bg-white/10 p-1 shadow-sm md:flex">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? path === "/"
                  : path.startsWith(item.href)

              return (
                <AppLink
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-white text-zinc-950"
                      : "text-zinc-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </AppLink>
              )
            })}
          </div>

          <Button asChild className="hidden cursor-pointer rounded-lg bg-white text-zinc-950 transition duration-200 hover:-translate-y-0.5 hover:!bg-white hover:!text-zinc-950 active:translate-y-0 md:inline-flex">
            <a href="https://wa.me/6287887540344"
              target="_blank"
              rel="noopener noreferrer">
              <WhatsappIcon className="size-4" />
              Contact
            </a>
          </Button>

          {mobileMenuOpen ? (
            <div className="mt-3 rounded-xl border border-white/10 bg-[#0d111a] p-2 shadow-2xl shadow-black/40 md:hidden">
              <div className="grid gap-1">
                {navItems.map((item) => {
                  const active =
                    item.href === "/"
                      ? path === "/"
                      : path.startsWith(item.href)

                  return (
                    <AppLink
                      key={item.href}
                      href={item.href}
                      onNavigate={() => setMobileMenuOpen(false)}
                      className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-white text-zinc-950"
                          : "text-zinc-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </AppLink>
                  )
                })}
                <a
                  href="mailto:hello@example.com"
                  className="mt-1 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10 hover:text-white"
                >
                  <WhatsappIcon className="size-4" />
                  Contact
                </a>
              </div>
            </div>
          ) : null}
        </nav>
      </header>
      {children}
      <footer className="border-t border-white/10 bg-[#07090f] px-5 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_1fr]">
            <div>
              <AppLink href="/" className="inline-flex text-lg font-semibold text-white">
                Gufranaka Samudra
              </AppLink>
              <p className="mt-4 max-w-md leading-7 text-zinc-400">
                AI/ML Engineer focused on LLM systems, RAG pipelines, backend
                services, and practical production-ready machine learning.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">
                Navigation
              </h3>
              <div className="mt-4 grid gap-3 text-sm text-zinc-400">
                {navItems.map((item) => (
                  <AppLink
                    key={item.href}
                    href={item.href}
                    className="w-fit transition hover:text-white"
                  >
                    {item.label}
                  </AppLink>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">
                Connect
              </h3>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="GitHub"
                  className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/10 text-zinc-300 transition duration-200 hover:-translate-y-0.5 hover:!border-white/15 hover:!bg-white/10 hover:!text-zinc-300 active:translate-y-0"
                >
                  <GithubIcon className="size-4" />
                </a>
                <a
                  href="https://www.linkedin.com/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                  className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/10 text-zinc-300 transition duration-200 hover:-translate-y-0.5 hover:!border-white/15 hover:!bg-white/10 hover:!text-zinc-300 active:translate-y-0"
                >
                  <LinkedinIcon className="size-4" />
                </a>
                <a
                  href="https://wa.me/6287887540344"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="WhatsApp"
                  className="flex size-10 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/10 text-zinc-300 transition duration-200 hover:-translate-y-0.5 hover:!border-white/15 hover:!bg-white/10 hover:!text-zinc-300 active:translate-y-0"
                >
                  <WhatsappIcon className="size-4" />
                </a>
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                Available for backend, AI, ML, DevOps, and software development
                collaborations.
              </p>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-sm text-zinc-500">
            <p>© 2026 Gufranaka Samudra. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

function HomePage({ latestPosts }: { latestPosts: BlogPost[] }) {
  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-5 md:py-24">
        <div className="grid items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
          <div className="relative mx-auto w-full max-w-[min(100%,22rem)] sm:max-w-sm">
            <div className="absolute inset-0 translate-x-2 translate-y-3 rounded-2xl bg-cyan-300 sm:translate-x-4 sm:translate-y-4" />
            <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl shadow-cyan-950/40">
              <img
                src={heroImg}
                alt="Foto profil Gufra"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 left-4 right-4 rounded-xl border border-white/15 bg-white p-4 text-zinc-950 shadow-xl shadow-black/40 sm:left-6 sm:right-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-800">
                  <Sparkles className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Available for projects</p>
                  <p className="text-sm leading-5 text-zinc-500">
                    Backend, AI, ML, DevOps, Software Development
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full min-w-0 max-w-3xl pt-8 text-left md:mx-0 md:pt-0">
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-sm font-medium text-cyan-100 sm:px-4">
              <MapPin className="size-4" />
              <span className="truncate">Indonesia based developer</span>
            </div>
            <h1 className="max-w-full break-words text-[2.4rem] font-semibold leading-tight tracking-tight text-white min-[380px]:text-4xl sm:text-5xl md:text-6xl lg:whitespace-nowrap lg:text-[4.25rem]">
              Gufranaka Samudra
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg md:mt-5 md:text-xl md:leading-9">
              AI/ML Engineer with 3+ years of experience building production-ready LLM, RAG, FastAPI, and backend systems, specializing in scalable AI pipelines, vector search optimization, healthcare AI solutions, semantic search, and robust APIs for real-world applications.
            </p>
            <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 cursor-pointer rounded-lg bg-white px-4 text-base text-zinc-950 transition duration-200 hover:-translate-y-0.5 hover:!bg-white hover:!text-zinc-950 active:translate-y-0"
              >
                <AppLink href="/project">
                  Lihat Project
                  <ArrowUpRight className="size-4" />
                </AppLink>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-12 cursor-pointer rounded-lg bg-white px-4 text-base text-zinc-950 transition duration-200 hover:-translate-y-0.5 hover:!bg-white hover:!text-zinc-950 active:translate-y-0"
              >
                <a href={resumePdf} download="Gufranaka-Samudra-Resume.pdf">
                  Download Resume
                  <Download className="size-4" />
                </a>
              </Button>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://github.com/AgufSamudra"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/10 text-zinc-300 transition duration-200 hover:-translate-y-0.5 hover:!border-white/15 hover:!bg-white/10 hover:!text-zinc-300 active:translate-y-0"
              >
                <GithubIcon className="size-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/gufranaka-samudra/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-white/15 bg-white/10 text-zinc-300 transition duration-200 hover:-translate-y-0.5 hover:!border-white/15 hover:!bg-white/10 hover:!text-zinc-300 active:translate-y-0"
              >
                <LinkedinIcon className="size-4" />
              </a>
            </div>

            {/* <div className="mt-12 grid max-w-3xl gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4">
              {["Python", "Go", "TypeScript", "Docker"].map((skill) => (
                <div
                  key={skill}
                  className="flex h-14 items-center rounded-xl border border-white/10 bg-white/10 px-4 text-base font-semibold text-zinc-100 sm:h-16 sm:px-5"
                >
                  {skill}
                </div>
              ))}
            </div> */}
          </div>
        </div>
      </section>

      <ExperienceSection />
      <EducationSection />
      <CertificationSection />
      <ProjectSection />
      <LatestBlogSection posts={latestPosts} />
    </>
  )
}

function ExperienceSection() {
  return (
    <section id="experience" className="border-y border-white/10 bg-white px-5 py-20 text-zinc-950">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
            Experience
          </p>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Work Experience
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {experiences.map((item) => (
            <article
              key={`${item.role}-${item.company}`}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <span className="flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
                  <BriefcaseBusiness className="size-5" />
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm text-zinc-500">
                  <CalendarDays className="size-4" />
                  {item.period}
                </span>
              </div>
              <h3 className="text-xl font-semibold">{item.role}</h3>
              <p className="mt-1 font-medium text-cyan-700">{item.company}</p>
              <p className="mt-4 leading-7 text-zinc-600">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function EducationSection() {
  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHeader eyebrow="Education" title="Educational Background" />
        <div className="space-y-4">
          {educations.map((item) => (
            <article
              key={item.school}
              className="rounded-xl border border-white/10 bg-white/10 p-6"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-950">
                  <GraduationCap className="size-6" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-white">{item.school}</h3>
                  <p className="mt-1 font-medium text-zinc-200">{item.major}</p>
                  <p className="mt-1 text-sm text-zinc-500">{item.period}</p>
                  <p className="mt-4 leading-7 text-zinc-400">
                    {item.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function CertificationSection() {
  return (
    <section className="border-y border-white/10 bg-[#0d111a] px-5 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Certification
            </p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Certificate of Competence
            </h2>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-4">
          {certifications.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noreferrer" : undefined}
              className="block h-full w-full cursor-pointer rounded-xl border border-white/10 bg-white p-5 text-zinc-950 transition duration-200 hover:-translate-y-1 hover:!bg-white hover:!text-zinc-950 hover:shadow-xl hover:shadow-black/30 active:translate-y-0 sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
            >
              <Award className="mb-5 size-7 text-cyan-700" />
              <h3 className="font-semibold">{item.title}</h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProjectSection() {
  return (
    <section id="project" className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Project"
          title="Selected Project"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {projects.map((project) => {
            const isExternalProject = project.href.startsWith("http")

            return (
              <a
                key={project.title}
                href={project.href}
                target={isExternalProject ? "_blank" : undefined}
                rel={isExternalProject ? "noreferrer" : undefined}
                className="group block h-full cursor-pointer rounded-xl border border-white/10 bg-white/10 p-6 transition duration-200 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.13] hover:shadow-xl hover:shadow-black/30"
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                    return
                  }

                  if (project.href === "#") {
                    event.preventDefault()
                    window.scrollTo({ top: 0, behavior: "smooth" })
                    return
                  }

                  if (project.href.startsWith("/")) {
                    event.preventDefault()
                    navigateTo(project.href)
                  }
                }}
              >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-medium text-cyan-100 transition group-hover:bg-cyan-300/15">
                    {project.type}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                      project.visibility === "Public"
                        ? "bg-blue-400/15 text-blue-100 group-hover:bg-blue-400/20"
                        : "bg-red-400/15 text-red-100 group-hover:bg-red-400/20"
                    }`}
                  >
                    {project.visibility}
                  </span>
                </div>
                <ArrowUpRight className="size-5 text-zinc-500 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cyan-100" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                {project.title}
              </h3>
              <p className="mt-4 min-h-24 leading-7 text-zinc-400">
                {project.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {project.stack.map((stack) => (
                  <span
                    key={stack}
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-400 transition group-hover:border-white/20"
                  >
                    {stack}
                  </span>
                ))}
              </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function LatestBlogSection({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="border-t border-white/10 bg-white px-5 py-20 text-zinc-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Blog
            </p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Baca blog terbaru!
            </h2>
          </div>
          <Button asChild variant="outline" className="w-fit cursor-pointer rounded-lg transition duration-200 hover:-translate-y-0.5 active:translate-y-0">
            <AppLink href="/blog">
              Lihat semua
              <ArrowUpRight className="size-4" />
            </AppLink>
          </Button>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {posts.slice(0, 2).map((post) => (
            <BlogCard key={post.slug} post={post} light />
          ))}
        </div>
      </div>
    </section>
  )
}

function BlogCard({ post, light = false }: { post: BlogPost; light?: boolean }) {
  return (
    <article
      className={
        light
          ? "group rounded-xl border border-zinc-200 bg-zinc-50 p-6 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-200"
          : "group rounded-xl border border-white/10 bg-white/10 p-6 transition duration-200 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.13] hover:shadow-xl hover:shadow-black/30"
      }
    >
      <div
        className={`mb-5 flex flex-wrap items-center gap-3 text-sm font-medium transition ${
          light ? "text-cyan-700" : "text-cyan-200"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <BookOpen className="size-4" />
          {formatDate(post.date)}
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock3 className="size-4" />
          {post.readingTime}
        </span>
      </div>
      <h3
        className={`text-2xl font-semibold tracking-tight ${
          light ? "text-zinc-950" : "text-white"
        }`}
      >
        {post.title}
      </h3>
      <p className={`mt-4 leading-7 ${light ? "text-zinc-600" : "text-zinc-400"}`}>
        {post.excerpt}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className={
              light
                ? "rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-500"
                : "rounded-lg border border-white/10 px-2.5 py-1 text-xs font-medium text-zinc-400 transition group-hover:border-white/20"
            }
          >
            {tag}
          </span>
        ))}
      </div>
      <Button
        asChild
        variant={light ? "ghost" : "outline"}
        className={`mt-6 cursor-pointer rounded-lg transition duration-200 hover:-translate-y-0.5 active:translate-y-0 ${light ? "px-0 hover:bg-transparent" : "border-white/20 bg-transparent text-white hover:!border-white/20 hover:!bg-transparent hover:!text-white"}`}
      >
        <AppLink href={`/blog/${post.slug}`}>
          Baca tulisan
          <ArrowUpRight className="size-4" />
        </AppLink>
      </Button>
    </article>
  )
}

function BlogPage({ posts }: { posts: BlogPost[] }) {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLowerCase()
  const filteredPosts = useMemo(() => {
    if (!normalizedQuery) {
      return posts
    }

    return posts.filter((post) =>
      [post.title, post.excerpt].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ),
    )
  }, [normalizedQuery, posts])

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:py-24">
      <div className="mb-12 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] md:items-end">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Blog
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-white md:text-7xl">
            Baca Blog Terbaru
          </h1>
        </div>
        <label className="relative block">
          <span className="sr-only">Cari blog</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari berdasarkan title atau excerpt..."
            className="h-13 w-full rounded-xl border border-white/10 bg-white/10 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-300/60 focus:bg-white/[0.13]"
          />
        </label>
      </div>
      {filteredPosts.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/10 p-8 text-center">
          <p className="text-lg font-medium text-white">Blog tidak ditemukan.</p>
          <p className="mt-2 text-zinc-400">
            Coba gunakan kata kunci lain dari judul atau excerpt.
          </p>
        </div>
      )}
    </section>
  )
}

function BlogPostPage({ post }: { post?: BlogPost }) {
  if (!post) {
    return (
      <section className="mx-auto w-full max-w-3xl px-5 py-24">
        <h1 className="text-4xl font-semibold text-white">Blog tidak ditemukan.</h1>
        <p className="mt-4 text-zinc-400">
          File Markdown untuk slug ini belum ada di `src/content/blog`.
        </p>
        <Button asChild className="mt-8 cursor-pointer rounded-lg bg-white text-zinc-950 transition duration-200 hover:-translate-y-0.5 hover:!bg-white hover:!text-zinc-950 active:translate-y-0">
          <AppLink href="/blog">
            <ArrowLeft className="size-4" />
            Kembali ke Blog
          </AppLink>
        </Button>
      </section>
    )
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-16 md:py-24">
      <Button
        asChild
        variant="outline"
        className="mb-10 cursor-pointer rounded-lg border-white/20 bg-transparent text-white transition duration-200 hover:-translate-y-0.5 hover:!border-white/20 hover:!bg-transparent hover:!text-white active:translate-y-0"
      >
        <AppLink href="/blog">
          <ArrowLeft className="size-4" />
          Semua Blog
        </AppLink>
      </Button>
      <div className="mb-10">
        <div className="mb-5 flex flex-wrap items-center gap-3 text-sm font-medium text-cyan-200">
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-4" />
            {formatDate(post.date)}
          </span>
          <span className="inline-flex items-center gap-2">
            <Clock3 className="size-4" />
            {post.readingTime}
          </span>
        </div>
        <h1 className="text-5xl font-semibold tracking-tight text-white md:text-6xl">
          {post.title}
        </h1>
        <p className="mt-6 text-xl leading-8 text-zinc-400">{post.excerpt}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-medium text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <MarkdownContent content={post.content} />
    </article>
  )
}

function ProjectPage() {
  return (
    <>
      <ProjectSection />
    </>
  )
}

function formatDate(date: string) {
  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate)
}

function parseDateValue(date: string) {
  const timestamp = new Date(date).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const posts = useMemo(() => getBlogPosts(), [])

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const blogSlug = path.match(/^\/blog\/([^/]+)$/)?.[1]
  const currentPost = posts.find((post) => post.slug === blogSlug)

  return (
    <Layout path={path}>
      {blogSlug ? (
        <BlogPostPage post={currentPost} />
      ) : path === "/blog" ? (
        <BlogPage posts={posts} />
      ) : path === "/project" ? (
        <ProjectPage />
      ) : (
        <HomePage latestPosts={posts} />
      )}
    </Layout>
  )
}

export default App
