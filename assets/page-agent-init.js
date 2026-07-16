/**
 * お気持ち顧問 × Page Agent
 * - 公式英語/中国語パネルは非表示
 * - サイト同調の日本語コンパクトUI
 * - デフォルトは閉じたFAB（デザインを邪魔しない）
 */
(function initOmoikomiPageAgent() {
  'use strict'

  var DEMO = {
    model: 'qwen3.5-plus',
    baseURL: 'https://page-ag-testing-ohftxirgbn.cn-shanghai.fcapp.run',
    apiKey: 'NA',
  }

  var SYSTEM = [
    'あなたは「ラスワンのお気持ち顧問」サイトの案内AIです。',
    '訪問者の日本語指示に従い、このページ内のUIだけを操作して案内してください。',
    '',
    'サイト構成:',
    '- #hero トップ / #story 経歴 / #pillars ポイント / #services できること',
    '- #lens カメラ体験 / #photowall 写真 / #gallery 現場 / #docs 資料',
    '- #pricing 料金 / #hub 相談ハブ（LINE・電話）',
    '',
    '方針:',
    '- 料金・相談は #pricing と #hub を優先',
    '- 連絡は公式LINE か 電話 080-4098-7362 を案内',
    '- 投資・収益の断定保証はしない。サイト記載に沿う',
    '- ページ外操作や個人情報入力の強要はしない',
    '- 操作は最小限。目的のセクションまで案内できたら完了',
  ].join('\n')

  var CHIPS = [
    { label: '料金', task: '料金セクションへスクロールして見せて' },
    { label: 'できること', task: 'できることセクションへ移動して' },
    { label: '資料', task: '資料セクションへスクロールして' },
    { label: 'LINE相談', task: 'LINEで相談するボタンの位置までスクロールして目立たせて' },
    { label: '経歴', task: '経歴ストーリーのセクションを見せて' },
  ]

  var STATUS_JA = {
    idle: '待機中 · やりたいことを入力',
    running: '操作中…',
    thinking: '考えています…',
    completed: '完了しました',
    error: 'うまくいきませんでした',
    stopped: '中止しました',
    loading: 'AIを準備中…',
    ready: '準備完了 · 日本語で指示できます',
  }

  var root
  var els = {}
  var agentReady = false
  var running = false

  function el(tag, className, attrs) {
    var node = document.createElement(tag)
    if (className) node.className = className
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'text') node.textContent = attrs[k]
        else if (k === 'html') node.innerHTML = attrs[k]
        else node.setAttribute(k, attrs[k])
      })
    }
    return node
  }

  function setStatus(state, message) {
    if (!els.status) return
    els.status.dataset.state = state || 'idle'
    els.statusText.textContent = message || STATUS_JA[state] || STATUS_JA.idle
    if (els.fab) {
      els.fab.classList.toggle('is-busy', state === 'running' || state === 'thinking' || state === 'loading')
    }
  }

  function logLine(text, kind) {
    if (!els.log) return
    els.log.classList.add('is-visible')
    var p = el('p', 'omo-ai-log-line' + (kind ? ' is-' + kind : ''))
    p.textContent = text
    els.log.appendChild(p)
    els.log.scrollTop = els.log.scrollHeight
    // 多すぎたら古いものを間引く
    while (els.log.children.length > 40) {
      els.log.removeChild(els.log.firstChild)
    }
  }

  function setOpen(open) {
    if (!root) return
    root.classList.toggle('is-open', !!open)
    els.fab.setAttribute('aria-expanded', open ? 'true' : 'false')
    if (open) {
      setTimeout(function () {
        try { els.input.focus() } catch (_) {}
      }, 30)
    }
  }

  function setRunning(isRunning) {
    running = !!isRunning
    if (!root) return
    root.classList.toggle('is-running', running)
    els.send.disabled = running
    els.input.disabled = running
    Array.prototype.forEach.call(els.chips.querySelectorAll('.omo-ai-chip'), function (c) {
      c.disabled = running
    })
  }

  function hideOfficialPanel(agent) {
    try {
      if (agent && agent.panel) {
        if (typeof agent.panel.hide === 'function') agent.panel.hide()
        if (typeof agent.panel.collapse === 'function') agent.panel.collapse()
        // ラッパー自体をDOMから隠す
        var w = agent.panel.wrapper
        if (w && w.style) {
          w.style.setProperty('display', 'none', 'important')
          w.style.setProperty('pointer-events', 'none', 'important')
          w.setAttribute('aria-hidden', 'true')
        }
      }
    } catch (_) {}

    var kill = function () {
      document.querySelectorAll('[class*="_wrapper_1tu05"]').forEach(function (n) {
        n.style.setProperty('display', 'none', 'important')
        n.style.setProperty('pointer-events', 'none', 'important')
      })
    }
    kill()
    setTimeout(kill, 200)
    setTimeout(kill, 800)
  }

  function buildUI() {
    if (document.getElementById('omo-ai')) return

    root = el('div', '', { id: 'omo-ai', role: 'region', 'aria-label': 'サイト案内AI' })

    // FAB
    els.fab = el('button', 'omo-ai-fab', {
      type: 'button',
      'aria-expanded': 'false',
      'aria-controls': 'omo-ai-panel',
    })
    els.fab.appendChild(el('span', 'omo-ai-fab-dot', { 'aria-hidden': 'true' }))
    els.fab.appendChild(el('span', '', { text: 'AI案内' }))
    els.fab.addEventListener('click', function () {
      setOpen(true)
    })

    // Panel
    els.panel = el('div', 'omo-ai-panel', { id: 'omo-ai-panel' })

    var head = el('div', 'omo-ai-head')
    var titleWrap = el('div', 'omo-ai-title-wrap')
    titleWrap.appendChild(el('h2', 'omo-ai-title', { text: 'AI案内' }))
    titleWrap.appendChild(el('p', 'omo-ai-sub', { text: 'このページを日本語で操作' }))
    head.appendChild(titleWrap)

    var headActions = el('div', 'omo-ai-head-actions')
    var stopTop = el('button', 'omo-ai-icon-btn', {
      type: 'button',
      title: '中止',
      'aria-label': '操作を中止',
      text: '■',
    })
    stopTop.addEventListener('click', function () { stopTask() })
    var closeBtn = el('button', 'omo-ai-icon-btn', {
      type: 'button',
      title: '閉じる',
      'aria-label': 'AI案内を閉じる',
      text: '×',
    })
    closeBtn.addEventListener('click', function () { setOpen(false) })
    headActions.appendChild(stopTop)
    headActions.appendChild(closeBtn)
    head.appendChild(headActions)
    els.panel.appendChild(head)

    els.status = el('div', 'omo-ai-status', { 'data-state': 'loading' })
    els.status.appendChild(el('span', 'omo-ai-status-dot', { 'aria-hidden': 'true' }))
    els.statusText = el('span', '', { text: STATUS_JA.loading })
    els.status.appendChild(els.statusText)
    els.panel.appendChild(els.status)

    els.chips = el('div', 'omo-ai-chips', { 'aria-label': 'クイック操作' })
    CHIPS.forEach(function (chip) {
      var b = el('button', 'omo-ai-chip', { type: 'button', text: chip.label })
      b.addEventListener('click', function () {
        runTask(chip.task)
      })
      els.chips.appendChild(b)
    })
    els.panel.appendChild(els.chips)

    els.log = el('div', 'omo-ai-log', { 'aria-live': 'polite' })
    els.panel.appendChild(els.log)

    var form = el('form', 'omo-ai-form')
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      var v = (els.input.value || '').trim()
      if (v) runTask(v)
    })

    els.input = el('textarea', 'omo-ai-input', {
      rows: '1',
      placeholder: '例: 料金を見せて',
      enterkeyhint: 'send',
      'aria-label': '案内してほしい内容',
    })
    els.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        form.requestSubmit()
      }
    })

    els.send = el('button', 'omo-ai-send', { type: 'submit', text: '実行' })
    els.stop = el('button', 'omo-ai-stop', { type: 'button', text: '中止' })
    els.stop.addEventListener('click', function () { stopTask() })

    form.appendChild(els.input)
    form.appendChild(els.send)
    form.appendChild(els.stop)
    els.panel.appendChild(form)

    els.panel.appendChild(
      el('p', 'omo-ai-foot', {
        text: '技術デモ用AI · 最終判断はご自身で · LINE/電話でも相談可',
      })
    )

    root.appendChild(els.fab)
    root.appendChild(els.panel)
    document.body.appendChild(root)

    // Esc で閉じる
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('is-open') && !running) {
        setOpen(false)
      }
    })
  }

  async function runTask(task) {
    if (!agentReady || !window.pageAgent) {
      setStatus('error', 'AIの準備ができていません')
      logLine('AIがまだ起動していません。少し待って再試行してください。', 'err')
      setOpen(true)
      return
    }
    if (running) return

    var text = String(task || '').trim()
    if (!text) return

    setOpen(true)
    setRunning(true)
    setStatus('running', STATUS_JA.running)
    logLine('依頼: ' + text, 'user')
    els.input.value = ''

    try {
      hideOfficialPanel(window.pageAgent)
      var result = await window.pageAgent.execute(text)
      if (result && result.success === false) {
        setStatus('error', STATUS_JA.error)
        logLine((result.data && String(result.data)) || 'タスクに失敗しました', 'err')
      } else {
        setStatus('done', STATUS_JA.completed)
        if (result && result.data) {
          var summary = String(result.data)
          if (summary.length > 180) summary = summary.slice(0, 180) + '…'
          logLine(summary, 'ok')
        } else {
          logLine('操作が完了しました', 'ok')
        }
      }
    } catch (err) {
      setStatus('error', STATUS_JA.error)
      logLine((err && err.message) || 'エラーが発生しました', 'err')
    } finally {
      setRunning(false)
      hideOfficialPanel(window.pageAgent)
    }
  }

  async function stopTask() {
    if (!window.pageAgent || !running) return
    try {
      setStatus('running', '中止しています…')
      await window.pageAgent.stop()
      setStatus('stopped', STATUS_JA.stopped)
      logLine('操作を中止しました', 'system')
    } catch (err) {
      logLine((err && err.message) || '中止に失敗しました', 'err')
    } finally {
      setRunning(false)
      hideOfficialPanel(window.pageAgent)
    }
  }

  function wireAgentEvents(agent) {
    try {
      agent.addEventListener('statuschange', function () {
        var s = agent.status
        if (s === 'running') setStatus('running', STATUS_JA.running)
        else if (s === 'completed') setStatus('done', STATUS_JA.completed)
        else if (s === 'error') setStatus('error', STATUS_JA.error)
        else if (s === 'stopped') setStatus('stopped', STATUS_JA.stopped)
        else if (s === 'idle' && !running) setStatus('idle', STATUS_JA.ready)
      })

      agent.addEventListener('activity', function (ev) {
        var detail = ev && ev.detail
        if (!detail || !detail.type) return
        if (detail.type === 'thinking') {
          setStatus('thinking', STATUS_JA.thinking)
        } else if (detail.type === 'executing') {
          var tool = detail.tool || '操作'
          var map = {
            click_element: 'クリックしています…',
            input_text: '入力しています…',
            scroll: 'スクロールしています…',
            wait: '待機しています…',
            done: '仕上げ中…',
          }
          setStatus('running', map[tool] || ('実行中: ' + tool))
        } else if (detail.type === 'error' && detail.message) {
          logLine(String(detail.message), 'err')
        }
      })

      // 質問はブラウザの簡易プロンプト（日本語）
      agent.onAskUser = function (question) {
        return Promise.resolve(
          window.prompt('AIからの質問:\n' + question, '') || ''
        )
      }
    } catch (_) {}
  }

  function createAgent() {
    if (window.__omoPageAgentBooted) return true
    if (typeof window.PageAgent !== 'function') return false

    try {
      window.pageAgent = new window.PageAgent({
        model: DEMO.model,
        baseURL: DEMO.baseURL,
        apiKey: DEMO.apiKey,
        language: 'en-US', // 公式UIは隠すので実質未使用
        maxSteps: 20,
        stepDelay: 0.35,
        enableMask: false,
        experimentalLlmsTxt: true,
        instructions: {
          system: SYSTEM,
          getPageInstructions: function () {
            return 'お気持ち顧問LP。料金=#pricing / 相談=#hub / 資料=#docs / できること=#services'
          },
        },
      })

      hideOfficialPanel(window.pageAgent)
      wireAgentEvents(window.pageAgent)

      agentReady = true
      window.__omoPageAgentBooted = true
      setStatus('idle', STATUS_JA.ready)
      logLine('準備完了。下のボタンか自由入力で案内できます。', 'system')
      console.log('[page-agent] 日本語UI接続済み')
      return true
    } catch (err) {
      console.error('[page-agent] 初期化失敗', err)
      setStatus('error', '起動に失敗しました')
      logLine((err && err.message) || '初期化エラー', 'err')
      return false
    }
  }

  function boot() {
    buildUI()
    setStatus('loading', STATUS_JA.loading)

    if (createAgent()) return

    var tries = 0
    var timer = setInterval(function () {
      tries += 1
      if (createAgent() || tries >= 40) {
        clearInterval(timer)
        if (!agentReady) {
          setStatus('error', '読み込みに失敗しました')
          logLine('Page Agent の読み込みに失敗しました（ネットワーク/CDN）', 'err')
        }
      }
    }, 200)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
