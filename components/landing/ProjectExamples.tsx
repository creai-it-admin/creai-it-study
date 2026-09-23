import Image from 'next/image';
import styles from './ProjectExamples.module.css';

const examples = [
  {
    image: 'youtube', category: 'CONTENT', title: 'AI로 만드는 영상 채널',
    description: '캐릭터와 이야기를 기획하고, 영상으로 만들어 채널에 쌓아가기.',
    alt: '요즘인간 유튜브 채널의 캐릭터 배너와 Shorts 영상 목록',
    href: 'https://www.youtube.com/@humannow-s3i',
  },
  {
    image: 'logistics', category: '3D DIGITAL TWIN', title: '물류센터 3D 트윈',
    description: '공간과 운영 데이터를 연결해 물류 현황을 살펴보는 데모.',
    alt: '물류창고의 3D 랙과 팔레트, 온도 상태와 재생 타임라인',
    href: 'https://logistic-ontology.ainos-ai.com/twin',
  },
  {
    image: 'farm', category: 'OPERATIONAL INTELLIGENCE', title: '스마트팜 운영 데모',
    description: '온실의 상태를 살피고 운영을 시뮬레이션하는 디지털 트윈.',
    alt: '스마트팜 온실의 3D 모델과 온도 그래프, 재배 현황',
    href: 'https://farmyirehse-demo.vercel.app/', access: '접속 코드 필요',
  },
  {
    image: 'vocab', category: 'LEARNING APP', title: '편입 영단어 학습 앱',
    description: '모르는 단어를 질문하고, 나만의 단어와 복습을 관리하는 앱.',
    alt: '편입단어 앱의 질문 입력창, 오늘 복습과 최근 단어 목록',
    href: 'https://pyeonip-vocab.vercel.app/',
  },
  {
    image: 'business', category: 'BUSINESS DISCOVERY', title: '신사업 발굴 앱',
    description: '기업의 강점에서 사업 기회를 찾고, 근거를 모아 검토하는 제품 미리보기.',
    alt: '사업 기회의 근거와 고객 피드백을 검토하는 Business Discovery 제품 미리보기',
    href: 'https://ainos-business-discovery.vercel.app/',
  },
];

export function ProjectExamples({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`${styles.examples} ${compact ? styles.compact : ''}`} aria-label="프로젝트 예시">
      <div className={styles.heading}>
        <div><span className={styles.eyebrow}>PROJECT EXAMPLES</span><h4>무엇을 만들 수 있을까요?</h4></div>
        <p>실제 프로젝트에서 출발해, 내 목표와 2주에 맞는 범위를 함께 정합니다.</p>
      </div>
      <ul className={styles.grid}>
        {examples.map(example => (
          <li key={example.image}>
            <a className={styles.card} href={example.href} target="_blank" rel="noopener noreferrer" aria-label={`${example.title} 보기 (새 탭${example.access ? `, ${example.access}` : ''})`}>
              <div className={styles.preview}>
                <Image src={`/landing/project-examples/${example.image}.jpg`} alt={example.alt} width={1280} height={720} sizes={compact ? '112px' : '(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 33vw'} />
              </div>
              <div className={styles.caption}>
                <span className={styles.category}>{example.category}</span>
                <div className={styles.title}><strong>{example.title}</strong><span aria-hidden="true">↗</span></div>
                <p>{example.description}</p>
                {example.access && <small>{example.access}</small>}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
