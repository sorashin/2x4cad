import React, { Suspense, lazy, memo } from "react"

// アイコンコンポーネントのキャッシュ
const iconCache: Record<string, React.LazyExoticComponent<React.ComponentType<React.SVGProps<SVGSVGElement>>>> = {}

// アイコンを取得する関数（キャッシュがあれば再利用）
const loadIcon = (name: string) => {
  if (!iconCache[name]) {
    iconCache[name] = lazy(async () => {
      try {
        // exportAsDefault: true を使用しているため、?reactは不要
        const module = await import(`../../assets/icons/${name}.svg`)
        // モジュールが正しく解決されているか確認
        if (module && module.default) {
          return { default: module.default }
        }
        throw new Error(`Failed to load icon: ${name}`)
      } catch (error) {
        console.error(`Error loading icon ${name}:`, error)
        throw error
      }
    })
  }
  return iconCache[name]
}

interface IconProps {
  name: string // SVGファイル名 (拡張子なし)
  color?: string // 上書き可能な色
  strokeWidth?: number // 上書き可能な線の太さ
  size?: number // アイコンのサイズ (幅と高さ)
  className?: string // 任意のクラス名
  onClick?: () => void // クリックイベントハンドラー
}

const Icon: React.FC<IconProps> = memo(
  ({ name, size = 24, className = "", onClick, color, strokeWidth }) => {
    // キャッシュからアイコンを取得または新たにロード
    const SvgIcon = loadIcon(name)

    const style: React.CSSProperties = {
      width: size,
      height: size,
      ...(color && { color }),
      ...(strokeWidth && { strokeWidth }),
    }

    return (
      <Suspense fallback={<div style={{ width: size, height: size }} />}>
        <SvgIcon
          style={style}
          className={className}
          onClick={onClick}
        />
      </Suspense>
    )
  }
)

Icon.displayName = 'Icon'

export default Icon

