import type { Metadata } from 'next'
import { headers } from 'next/headers'

import { Card, Disclaimer } from '@/components/ui'
import { getInviteContext } from '@/lib/data/invites'

import { InviteManager } from './InviteManager'

export const metadata: Metadata = { title: 'Mời khách' }
export const dynamic = 'force-dynamic'

export default async function InvitePage() {
  const context = await getInviteContext()
  const origin = await readOrigin()

  return (
    <div className="min-h-full bg-[#f7f9f5] pb-10">
      <div className="flex flex-col gap-5">
        {/* =========================================================
            HERO
        ========================================================= */}

        <section className="relative min-h-[310px] overflow-hidden rounded-[28px] bg-[#dff1bf]">
          {/* BACKGROUND DECORATION */}

          <div className="absolute -top-20 -right-16 size-[260px] rounded-full bg-[#c9e79e]" />

          <div className="absolute right-[180px] -bottom-24 size-[210px] rounded-full bg-[#eef8da]" />

          <div className="absolute -bottom-20 -left-16 size-[180px] rounded-full border-[25px] border-[#c8e39d]/60" />

          <div className="absolute top-8 left-[48%] size-5 rounded-full bg-[#b4d77f]" />

          <div className="absolute top-20 left-[55%] text-[18px] text-[#7ea84e]">✦</div>

          {/* HERO TEXT */}

          <div className="relative z-20 flex min-h-[310px] items-center p-6 sm:p-8">
            <div className="max-w-[500px]">
              <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-[#5f7e40] uppercase">
                QUẢN LÝ KHÁCH HÀNG
              </p>

              <h1 className="text-[32px] leading-[1.08] font-extrabold tracking-[-0.045em] text-[#1f402b] sm:text-[40px]">
                Mời khách hàng
                <br />
                cùng bắt đầu hành trình
              </h1>

              <p className="mt-4 max-w-[410px] text-[12px] leading-[1.7] font-medium text-[#62745d] sm:text-[13px]">
                Kết nối khách hàng với tài khoản PT của bạn để bắt đầu theo dõi và đồng hành trong
                hành trình sức khỏe.
              </p>
            </div>
          </div>

          {/* =======================================================
              ILLUSTRATION
          ======================================================= */}

          <div className="absolute right-[-5px] bottom-0 z-10 hidden h-[285px] w-[410px] lg:block">
            <HeroIllustration />
          </div>
        </section>

        {/* =========================================================
            THREE STEPS
        ========================================================= */}

        <section>
          <div className="mb-3">
            <p className="text-[10px] font-bold tracking-[0.13em] text-[#819175] uppercase">
              GET STARTED
            </p>

            <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.025em] text-[#304335]">
              Kết nối khách hàng
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StepCard
              number="01"
              icon="↗"
              title="Tạo lời mời"
              description="Tạo lời mời dành riêng cho khách hàng bạn muốn kết nối."
              type="green"
            />

            <StepCard
              number="02"
              icon="➤"
              title="Chia sẻ"
              description="Gửi mã hoặc liên kết lời mời cho khách hàng."
              type="yellow"
            />

            <StepCard
              number="03"
              icon="●"
              title="Khách tham gia"
              description="Khách nhập mã và được kết nối với tài khoản PT."
              type="blue"
            />
          </div>
        </section>

        {/* =========================================================
            INVITE MANAGER
        ========================================================= */}

        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[0.13em] text-[#819175] uppercase">
                INVITATION
              </p>

              <h2 className="mt-1 text-[22px] font-extrabold tracking-[-0.025em] text-[#304335]">
                Mã mời khách hàng
              </h2>

              <p className="mt-1 text-[11px] font-medium text-[#8b948b]">
                Tạo và quản lý các lời mời kết nối với khách hàng.
              </p>
            </div>

            <div className="hidden rounded-full bg-[#edf5df] px-3 py-1.5 sm:block">
              <span className="text-[9px] font-bold text-[#6e8b49]">KẾT NỐI KHÁCH HÀNG</span>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[26px] border border-[#e2e9dc] bg-white shadow-[0_4px_18px_rgba(40,55,40,0.04)]">
            <InviteManager context={context} origin={origin} />
          </Card>
        </section>

        {/* =========================================================
            SMALL NOTE
        ========================================================= */}

        <section className="rounded-[22px] border border-[#e5ebe0] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#edf5df] text-[15px] font-bold text-[#71934b]">
              ✓
            </div>

            <div>
              <p className="text-[11px] font-bold text-[#455246]">Kết nối an toàn và rõ ràng</p>

              <p className="mt-0.5 text-[9px] font-medium text-[#969d95]">
                Mỗi lời mời được quản lý riêng để PT dễ dàng theo dõi khách hàng.
              </p>
            </div>
          </div>
        </section>

        <Disclaimer />
      </div>
    </div>
  )
}

/* ================================================================
   STEP CARD
================================================================ */

function StepCard({
  number,
  icon,
  title,
  description,
  type,
}: {
  number: string
  icon: string
  title: string
  description: string
  type: 'green' | 'yellow' | 'blue'
}) {
  const styles = {
    green: {
      background: 'bg-[#eef7e3]',
      icon: 'bg-[#d8ebbd] text-[#62863c]',
      number: 'text-[#71944b]',
      border: 'border-[#dcebc9]',
    },

    yellow: {
      background: 'bg-[#fff8e7]',
      icon: 'bg-[#ffedbd] text-[#aa8229]',
      number: 'text-[#b18b32]',
      border: 'border-[#f4e8c5]',
    },

    blue: {
      background: 'bg-[#edf7f8]',
      icon: 'bg-[#d7edf0] text-[#5e8d96]',
      number: 'text-[#67959d]',
      border: 'border-[#d8eaed]',
    },
  }

  const style = styles[type]

  return (
    <div
      className={`rounded-[21px] border ${style.border} ${style.background} p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex size-11 items-center justify-center rounded-2xl text-[19px] font-bold ${style.icon}`}
        >
          {icon}
        </div>

        <span className={`text-[12px] font-extrabold ${style.number}`}>{number}</span>
      </div>

      <h3 className="mt-4 text-[16px] font-extrabold text-[#344337]">{title}</h3>

      <p className="mt-1.5 text-[10px] leading-[1.65] font-medium text-[#7d877d]">{description}</p>
    </div>
  )
}

/* ================================================================
   HERO ILLUSTRATION
================================================================ */

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 430 300"
      className="h-full w-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* ---------------------------------------------------------
          SOFT BACKGROUND
      --------------------------------------------------------- */}

      <ellipse cx="245" cy="270" rx="170" ry="28" fill="#B7D985" opacity="0.45" />

      <circle cx="320" cy="100" r="80" fill="#EDF8D8" opacity="0.75" />

      {/* ---------------------------------------------------------
          LEAVES
      --------------------------------------------------------- */}

      <path d="M80 190C52 171 42 139 57 112C84 124 98 151 80 190Z" fill="#86AD55" />

      <path d="M76 184C83 151 99 131 124 119C127 147 109 172 76 184Z" fill="#A5C873" />

      <path d="M365 175C385 151 407 146 426 154C416 179 393 190 365 175Z" fill="#78A34A" />

      <path d="M355 128C367 101 388 88 409 91C407 116 388 135 355 128Z" fill="#A2C66B" />

      {/* ---------------------------------------------------------
          PERSON HAIR
      --------------------------------------------------------- */}

      <path
        d="M222 51C228 25 260 10 289 24C315 36 319 70 304 94L288 83L221 87C211 75 212 62 222 51Z"
        fill="#443F35"
      />

      <path
        d="M292 43C320 48 326 78 312 103C303 119 287 126 278 118L286 94L292 43Z"
        fill="#3B392F"
      />

      {/* ---------------------------------------------------------
          FACE
      --------------------------------------------------------- */}

      <ellipse cx="263" cy="75" rx="39" ry="45" fill="#F3C5A5" />

      {/* EAR */}

      <ellipse cx="299" cy="79" rx="7" ry="10" fill="#EAB697" />

      {/* HAIR FRONT */}

      <path
        d="M224 62C226 35 248 23 272 28C293 32 302 47 299 63C284 51 272 48 257 51C246 54 236 61 224 62Z"
        fill="#443F35"
      />

      {/* EYE */}

      <circle cx="250" cy="73" r="3" fill="#33352E" />

      <circle cx="278" cy="73" r="3" fill="#33352E" />

      {/* NOSE */}

      <path
        d="M263 75L260 86L266 87"
        stroke="#C78F72"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* SMILE */}

      <path
        d="M253 94C260 101 270 101 277 94"
        stroke="#A95D55"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* ---------------------------------------------------------
          NECK
      --------------------------------------------------------- */}

      <path d="M250 113V132H278V113" fill="#EAB697" />

      {/* ---------------------------------------------------------
          BODY / SHIRT
      --------------------------------------------------------- */}

      <path
        d="M218 139C229 128 244 124 264 124C285 124 302 132 312 147L327 235H204L218 139Z"
        fill="#679B4A"
      />

      {/* SHIRT LIGHT */}

      <path d="M252 132C257 143 271 143 277 132" stroke="#A9C982" strokeWidth="3" />

      {/* SMALL LOGO */}

      <circle cx="290" cy="155" r="9" fill="#8EB86A" />

      <path d="M285 155C288 150 293 151 295 155C292 160 287 160 285 155Z" fill="#E9F3D8" />

      {/* ---------------------------------------------------------
          LEFT ARM
      --------------------------------------------------------- */}

      <path
        d="M218 145C200 157 188 181 185 202"
        stroke="#F0C09F"
        strokeWidth="18"
        strokeLinecap="round"
      />

      {/* ---------------------------------------------------------
          RIGHT ARM HOLDING BOWL
      --------------------------------------------------------- */}

      <path
        d="M304 150C322 165 329 185 329 201"
        stroke="#F0C09F"
        strokeWidth="18"
        strokeLinecap="round"
      />

      {/* ---------------------------------------------------------
          BOWL
      --------------------------------------------------------- */}

      <path d="M170 191C170 191 186 242 235 242C284 242 300 191 300 191H170Z" fill="#FFF5D9" />

      <ellipse cx="235" cy="191" rx="65" ry="17" fill="#F8E8BD" />

      {/* FOOD */}

      <ellipse cx="210" cy="187" rx="17" ry="12" fill="#8DB65C" />

      <ellipse cx="241" cy="183" rx="16" ry="13" fill="#E5A54B" />

      <circle cx="267" cy="189" r="14" fill="#E98469" />

      <circle cx="225" cy="177" r="10" fill="#F0C95F" />

      <path
        d="M196 184C201 174 210 171 218 175"
        stroke="#6C9947"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* ---------------------------------------------------------
          FLOATING LEAVES
      --------------------------------------------------------- */}

      <path d="M120 83C104 70 105 53 119 43C136 52 138 69 120 83Z" fill="#83A955" />

      <path d="M344 66C359 51 377 54 385 69C369 81 353 81 344 66Z" fill="#80A951" />

      <path d="M352 112C363 98 379 96 389 107C379 121 364 124 352 112Z" fill="#9FC46A" />

      {/* SPARKLES */}

      <path
        d="M154 96V111M146.5 103.5H161.5"
        stroke="#7DA34D"
        strokeWidth="3"
        strokeLinecap="round"
      />

      <path d="M393 190V202M387 196H399" stroke="#9BBE65" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* ================================================================
   ORIGIN
================================================================ */

async function readOrigin(): Promise<string> {
  const headerList = await headers()

  const host = headerList.get('host') ?? 'localhost:3000'

  const proto = headerList.get('x-forwarded-proto') ?? 'http'

  return `${proto}://${host}`
}
