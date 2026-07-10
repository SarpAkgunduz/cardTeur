import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton';
import './LegalPage.css';

interface Section {
  heading: string;
  body: React.ReactNode;
}

const OPERATOR_NAME = 'Sarp Akgündüz';

const SECTIONS_EN: Section[] = [
  {
    heading: '1. Data We Collect',
    body: (
      <ul>
        <li><strong>Account data:</strong> email, display name, and profile photo, via Firebase Authentication (email/password or Google sign-in).</li>
        <li><strong>Player card data:</strong> stats, jersey number, preferred position, card images, and optional contact email you add for a player.</li>
        <li><strong>Social data:</strong> your friends list, friend requests, and crews you belong to or manage.</li>
        <li><strong>Match &amp; formation data:</strong> matches you schedule, formations you build, and voting activity on player cards.</li>
        <li><strong>Billing data:</strong> your subscription plan and renewal date. Card numbers and payment details are collected and processed directly by our payment processors (Paddle, iyzico) — we never see or store full card numbers.</li>
        <li><strong>Usage data:</strong> basic technical data (e.g. browser locale, used to auto-select your language) and, on Premium+, in-app analytics about how you use the Service.</li>
      </ul>
    ),
  },
  {
    heading: '2. How We Use It',
    body: (
      <ul>
        <li>To operate the Service — accounts, player cards, crews, match/formation building, and the voting feature.</li>
        <li>To enforce plan limits (e.g. max players/crews) and process subscription billing.</li>
        <li>To run the referral program (tracking codes, slots, and rewards).</li>
        <li>To send transactional email (e.g. invites, account notices) via our email provider, Resend.</li>
        <li>To keep the Service secure and prevent abuse.</li>
      </ul>
    ),
  },
  {
    heading: '3. Who We Share Data With',
    body: (
      <>
        <p>We do not sell your personal data. We share data only with service providers who help us run CardTeur:</p>
        <ul>
          <li><strong>Firebase / Google</strong> — authentication.</li>
          <li><strong>MongoDB</strong> (database hosting) — stores your account, player, crew, and match data.</li>
          <li><strong>Cloudflare R2</strong> — stores player card images.</li>
          <li><strong>Resend</strong> — sends transactional emails.</li>
          <li><strong>Paddle</strong> and <strong>iyzico</strong> — process subscription payments as independent merchants/data controllers for payment data.</li>
          <li><strong>Railway / Cloudflare Workers</strong> — host our backend and frontend.</li>
        </ul>
        <p>We may also disclose data if required by law or to protect the rights, safety, or property of CardTeur or our users.</p>
      </>
    ),
  },
  {
    heading: '4. Data Retention',
    body: (
      <p>
        We keep your data for as long as your account is active. Match history is retained according
        to your plan's history window (3 / 12 / 60 months for Free / Premium / Premium+). If you
        delete your account, we delete or anonymize your personal data within a reasonable period,
        except where we must retain records for legal or billing purposes.
      </p>
    ),
  },
  {
    heading: '5. Your Rights',
    body: (
      <p>
        Depending on where you live (e.g. under GDPR in the EU/EEA or KVKK in Turkey), you may have
        the right to access, correct, export, or delete your personal data, and to object to or
        restrict certain processing. Most of this you can do yourself from your{' '}
        <a href="/profile">Profile</a> page (edit your info, or use the danger-zone account
        deletion). For anything else, contact us at{' '}
        <a href="mailto:sarpakg@gmail.com">sarpakg@gmail.com</a>.
      </p>
    ),
  },
  {
    heading: '6. Cookies & Local Storage',
    body: (
      <p>
        We use your browser's local storage (not third-party tracking cookies) to keep you signed in
        and to remember your selected language. We do not use advertising cookies or sell data to
        advertisers.
      </p>
    ),
  },
  {
    heading: "7. Children's Privacy",
    body: (
      <p>
        CardTeur is not directed at children under 13 (or the minimum age required in your country),
        and we do not knowingly collect personal data from them. If you believe a child has provided
        us data, contact us and we will delete it.
      </p>
    ),
  },
  {
    heading: '8. International Data Transfers',
    body: (
      <p>
        Our service providers may process data outside your home country. Where required, we rely on
        appropriate safeguards (such as standard contractual clauses) for these transfers.
      </p>
    ),
  },
  {
    heading: '9. Security',
    body: (
      <p>
        We use industry-standard measures (authentication via Firebase, access-scoped database
        queries, encrypted connections) to protect your data. No system is 100% secure, so we can't
        guarantee absolute security.
      </p>
    ),
  },
  {
    heading: '10. Changes to This Policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. Material changes will be announced in
        the Service or by email before they take effect.
      </p>
    ),
  },
  {
    heading: '11. Contact',
    body: (
      <p>
        Questions about this Privacy Policy? Contact us at{' '}
        <a href="mailto:sarpakg@gmail.com">sarpakg@gmail.com</a>.
      </p>
    ),
  },
];

const SECTIONS_TR: Section[] = [
  {
    heading: '1. Topladığımız Veriler',
    body: (
      <ul>
        <li><strong>Hesap verileri:</strong> Firebase Authentication (e-posta/şifre veya Google ile giriş) üzerinden e-posta, görünen ad ve profil fotoğrafı.</li>
        <li><strong>Oyuncu kartı verileri:</strong> istatistikler, forma numarası, tercih edilen mevki, kart görselleri ve bir oyuncu için eklediğiniz isteğe bağlı iletişim e-postası.</li>
        <li><strong>Sosyal veriler:</strong> arkadaş listeniz, arkadaşlık istekleri ve üyesi olduğunuz veya yönettiğiniz ekipler.</li>
        <li><strong>Maç ve diziliş verileri:</strong> planladığınız maçlar, oluşturduğunuz dizilişler ve oyuncu kartlarına yönelik oylama etkinliği.</li>
        <li><strong>Faturalandırma verileri:</strong> abonelik planınız ve yenileme tarihiniz. Kart numaraları ve ödeme detayları doğrudan ödeme sağlayıcılarımız (Paddle, iyzico) tarafından toplanır ve işlenir — tam kart numaralarını asla görmeyiz veya saklamayız.</li>
        <li><strong>Kullanım verileri:</strong> temel teknik veriler (örn. dilinizi otomatik seçmek için kullanılan tarayıcı bölgesi) ve Premium+ planında uygulama içi kullanım analitiği.</li>
      </ul>
    ),
  },
  {
    heading: '2. Verileri Nasıl Kullanıyoruz',
    body: (
      <ul>
        <li>Hizmeti işletmek — hesaplar, oyuncu kartları, ekipler, maç/diziliş oluşturma ve oylama özelliği.</li>
        <li>Plan limitlerini uygulamak (örn. maksimum oyuncu/ekip sayısı) ve abonelik faturalandırmasını işlemek.</li>
        <li>Referans programını yürütmek (kod takibi, haklar ve ödüller).</li>
        <li>E-posta sağlayıcımız Resend aracılığıyla işlemsel e-posta göndermek (örn. davetler, hesap bildirimleri).</li>
        <li>Hizmeti güvenli tutmak ve kötüye kullanımı önlemek.</li>
      </ul>
    ),
  },
  {
    heading: '3. Verileri Kimlerle Paylaşıyoruz',
    body: (
      <>
        <p>Kişisel verilerinizi satmıyoruz. Verileri yalnızca CardTeur'u çalıştırmamıza yardımcı olan hizmet sağlayıcılarla paylaşıyoruz:</p>
        <ul>
          <li><strong>Firebase / Google</strong> — kimlik doğrulama.</li>
          <li><strong>MongoDB</strong> (veritabanı barındırma) — hesap, oyuncu, ekip ve maç verilerinizi saklar.</li>
          <li><strong>Cloudflare R2</strong> — oyuncu kartı görsellerini saklar.</li>
          <li><strong>Resend</strong> — işlemsel e-postaları gönderir.</li>
          <li><strong>Paddle</strong> ve <strong>iyzico</strong> — ödeme verileri için bağımsız satıcı/veri sorumlusu olarak abonelik ödemelerini işler.</li>
          <li><strong>Railway / Cloudflare Workers</strong> — arka uç ve ön ucumuzu barındırır.</li>
        </ul>
        <p>Yasaların gerektirdiği durumlarda veya CardTeur'un ya da kullanıcılarımızın hak, güvenlik ya da mülkiyetini korumak için de veri paylaşabiliriz.</p>
      </>
    ),
  },
  {
    heading: '4. Veri Saklama',
    body: (
      <p>
        Hesabınız aktif olduğu sürece verilerinizi saklarız. Maç geçmişi, planınızın geçmiş penceresine
        göre saklanır (Ücretsiz / Premium / Premium+ için 3 / 12 / 60 ay). Hesabınızı silerseniz,
        yasal veya faturalandırma amaçlı kayıtları tutmamız gereken durumlar dışında, kişisel
        verilerinizi makul bir süre içinde sileriz veya anonimleştiririz.
      </p>
    ),
  },
  {
    heading: '5. Haklarınız',
    body: (
      <p>
        Yaşadığınız yere bağlı olarak (örn. AB/AEA'da GDPR veya Türkiye'de KVKK kapsamında), kişisel
        verilerinize erişme, düzeltme, dışa aktarma veya silme ve belirli işlemlere itiraz etme ya da
        bunları kısıtlama hakkına sahip olabilirsiniz. Bunların çoğunu{' '}
        <a href="/profile">Profil</a> sayfanızdan kendiniz yapabilirsiniz (bilgilerinizi düzenleyin
        veya tehlike bölgesindeki hesap silme seçeneğini kullanın). Diğer talepleriniz için bize{' '}
        <a href="mailto:sarpakg@gmail.com">sarpakg@gmail.com</a> adresinden ulaşabilirsiniz.
      </p>
    ),
  },
  {
    heading: '6. Çerezler ve Yerel Depolama',
    body: (
      <p>
        Oturumunuzu açık tutmak ve seçtiğiniz dili hatırlamak için tarayıcınızın yerel depolamasını
        (üçüncü taraf takip çerezleri değil) kullanırız. Reklam çerezleri kullanmıyoruz veya
        verilerinizi reklamverenlere satmıyoruz.
      </p>
    ),
  },
  {
    heading: '7. Çocukların Gizliliği',
    body: (
      <p>
        CardTeur, 13 yaşın altındaki (veya ülkenizde gereken asgari yaşın altındaki) çocuklara yönelik
        değildir ve bilerek onlardan kişisel veri toplamayız. Bir çocuğun bize veri sağladığını
        düşünüyorsanız, bizimle iletişime geçin, verileri sileriz.
      </p>
    ),
  },
  {
    heading: '8. Uluslararası Veri Aktarımları',
    body: (
      <p>
        Hizmet sağlayıcılarımız verileri kendi ülkeniz dışında işleyebilir. Gerekli olduğunda, bu
        aktarımlar için uygun güvenceler (standart sözleşme hükümleri gibi) kullanırız.
      </p>
    ),
  },
  {
    heading: '9. Güvenlik',
    body: (
      <p>
        Verilerinizi korumak için sektör standardı önlemler (Firebase üzerinden kimlik doğrulama,
        erişim kapsamlı veritabanı sorguları, şifreli bağlantılar) kullanıyoruz. Hiçbir sistem %100
        güvenli değildir, bu nedenle mutlak güvenliği garanti edemeyiz.
      </p>
    ),
  },
  {
    heading: '10. Bu Politikadaki Değişiklikler',
    body: (
      <p>
        Bu Gizlilik Politikasını zaman zaman güncelleyebiliriz. Önemli değişiklikler yürürlüğe
        girmeden önce Hizmet içinde veya e-posta yoluyla duyurulacaktır.
      </p>
    ),
  },
  {
    heading: '11. İletişim',
    body: (
      <p>
        Bu Gizlilik Politikasıyla ilgili sorularınız için bize{' '}
        <a href="mailto:sarpakg@gmail.com">sarpakg@gmail.com</a> adresinden ulaşabilirsiniz.
      </p>
    ),
  },
];

const PrivacyPage = () => {
  const { i18n } = useTranslation();
  const isTR = (i18n.resolvedLanguage || i18n.language || '').startsWith('tr');
  const sections = isTR ? SECTIONS_TR : SECTIONS_EN;

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="content-card">
          <div className="page-header">
            <div className="back-button-container">
              <BackButton fallback="/" position="static" />
            </div>
            <h2 className="page-title">{isTR ? 'Gizlilik Politikası' : 'Privacy Policy'}</h2>
          </div>

          <div className="legal-page">
            <span className="legal-page__updated">
              {isTR ? 'Son güncelleme: 10 Temmuz 2026' : 'Last updated: July 10, 2026'}
            </span>

            <p className="legal-page__intro">
              {isTR ? (
                <>
                  Bu Gizlilik Politikası, CardTeur'u ({OPERATOR_NAME}, "biz") kullanırken hangi kişisel
                  verileri topladığımızı, neden topladığımızı ve sahip olduğunuz seçenekleri açıklar.
                </>
              ) : (
                <>
                  This Privacy Policy explains what personal data CardTeur ({OPERATOR_NAME}, "we",
                  "us") collects when you use the Service, why we collect it, and the choices you
                  have.
                </>
              )}
            </p>

            {sections.map((s) => (
              <div className="legal-page__section" key={s.heading}>
                <h3>{s.heading}</h3>
                {s.body}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
