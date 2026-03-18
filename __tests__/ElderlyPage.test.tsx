import { render, screen, fireEvent } from '@testing-library/react'
import ElderlyPage from '../src/app/page'

// SupabaseとGoogle Mapsのモック（テスト中に本物のAPIを叩かないようにする）
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  },
}))

describe('高齢者用メイン画面のテスト', () => {
  it('初期表示で「いざ、出陣！」ボタンが表示されること', () => {
    render(<ElderlyPage />)
    expect(screen.getByText('いざ、出陣！')).toBeInTheDocument()
  })

  it('「出陣」ボタンを押すと、表示が「修行中」に変わること', () => {
    render(<ElderlyPage />)
    const startButton = screen.getByText('いざ、出陣！')
    fireEvent.click(startButton)
    expect(screen.getByText('修行中')).toBeInTheDocument()
    expect(screen.getByText('無事に帰還')).toBeInTheDocument()
  })
})