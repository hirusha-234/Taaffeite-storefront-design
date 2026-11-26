/*
 * Small stand-in for the React app's behaviour so the static pages feel like the real site:
 * dark/light theme, sticky header, mobile menu, cart drawer, scroll fade-ins and a few
 * buttons that move between pages. Forms, filters and sorting are not wired up.
 */
(function () {
  var html = document.documentElement
  var site = document.querySelector('.archive-site')
  var header = document.querySelector('.sf-header')
  var here = location.pathname.split('/').pop() || 'index.html'

  // Keep the invitation open during its closing motion so the envelope and letter
  // can fold away together before the native details panel is hidden.
  var invite = document.querySelector('.sf-invite-details')
  if (invite) {
    var inviteTrigger = invite.querySelector('summary')
    var inviteLetter = invite.querySelector('.sf-invite-letter')
    var inviteState = 'closed'
    var inviteFinishTimer

    function finishInviteMotion() {
      if (inviteState === 'opening') {
        inviteState = 'open'
      } else if (inviteState === 'closing') {
        invite.open = false
        invite.classList.remove('is-closing')
        inviteLetter.inert = false
        inviteState = 'closed'
      }
    }

    inviteTrigger.setAttribute('aria-expanded', 'false')
    inviteTrigger.addEventListener('click', function (event) {
      event.preventDefault()
      if (inviteState === 'opening' || inviteState === 'closing') return

      clearTimeout(inviteFinishTimer)
      if (inviteState === 'closed') {
        invite.open = true
        inviteLetter.inert = false
        inviteTrigger.setAttribute('aria-expanded', 'true')
        inviteState = 'opening'
        requestAnimationFrame(function () { invite.classList.add('is-open') })
      } else {
        inviteTrigger.setAttribute('aria-expanded', 'false')
        inviteLetter.inert = true
        invite.classList.remove('is-open')
        invite.classList.add('is-closing')
        inviteState = 'closing'
      }
      inviteFinishTimer = setTimeout(finishInviteMotion, 1000)
    })

    inviteLetter.addEventListener('animationend', function (event) {
      if (event.target === inviteLetter && event.animationName === 'sf-invite-open') {
        clearTimeout(inviteFinishTimer)
        finishInviteMotion()
      }
    })
  }

  // ---- Theme ----
  function applyTheme(dark) {
    html.dataset.theme = dark ? 'dark' : 'light'
    if (site) site.dataset.theme = dark ? 'dark' : 'light'
    document.querySelectorAll('.sf-theme-toggle').forEach(function (button) {
      button.textContent = dark ? 'Light' : 'Dark'
      button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme')
      button.setAttribute('title', dark ? 'Switch to light theme' : 'Switch to dark theme')
      button.setAttribute('aria-pressed', String(dark))
    })
    document.querySelectorAll('.sf-mobile-menu-prefs .sf-text-btn').forEach(function (button) {
      button.textContent = dark ? 'Switch to light theme' : 'Switch to dark theme'
      button.setAttribute('aria-pressed', String(dark))
    })
  }
  function isDark() { return html.dataset.theme === 'dark' }
  applyTheme(isDark())
  document.querySelectorAll('.sf-cart-toggle').forEach(function (button) {
    var match = button.getAttribute('aria-label').match(/(\d+)\s+items?/)
    if (match) button.setAttribute('data-count', match[1])
  })
  document.querySelectorAll('.sf-account-link').forEach(function (link) {
    link.setAttribute('aria-label', 'Account')
    link.setAttribute('title', 'Account')
    var name = (link.getAttribute('data-user-name') || (site && site.getAttribute('data-user-name')) || '').trim()
    if (!name) return
    var initials = name.split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0) }).join('').toLocaleUpperCase()
    link.setAttribute('data-initials', initials)
    link.setAttribute('aria-label', 'Account for ' + name)
    link.setAttribute('title', name)
  })
  var accountMenus = Array.from(document.querySelectorAll('.account-menu-wrap'))
  accountMenus.forEach(function (wrap) {
    var toggle = wrap.querySelector('.account-menu-toggle')
    var menu = wrap.querySelector('.account-identity')
    if (!toggle || !menu) return

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') !== 'true'
      toggle.setAttribute('aria-expanded', String(open))
      menu.hidden = !open
    })
  })
  if (accountMenus.length) {
    document.addEventListener('click', function (event) {
      accountMenus.forEach(function (wrap) {
        if (wrap.contains(event.target)) return
        var toggle = wrap.querySelector('.account-menu-toggle')
        var menu = wrap.querySelector('.account-identity')
        if (toggle && menu) {
          toggle.setAttribute('aria-expanded', 'false')
          menu.hidden = true
        }
      })
    })
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return
      accountMenus.forEach(function (wrap) {
        var toggle = wrap.querySelector('.account-menu-toggle')
        var menu = wrap.querySelector('.account-identity')
        if (!toggle || !menu || menu.hidden) return
        toggle.setAttribute('aria-expanded', 'false')
        menu.hidden = true
        toggle.focus()
      })
    })
  }
  var accountDetailTriggers = Array.from(document.querySelectorAll('[data-detail-template]'))
  if (accountDetailTriggers.length) {
    var accountDetailDialog = document.getElementById('account-detail-dialog')
    var accountDetailTitle = document.getElementById('account-detail-title')
    var accountDetailBody = document.getElementById('account-detail-body')
    var accountDetailClose = accountDetailDialog && accountDetailDialog.querySelector('.account-detail-close')
    if (!accountDetailDialog || !accountDetailTitle || !accountDetailBody || !accountDetailClose) {
      console.error('Account detail buttons require a complete detail dialog.')
    } else {
      accountDetailTriggers.forEach(function (trigger) {
        trigger.addEventListener('click', function () {
          var template = document.getElementById(trigger.getAttribute('data-detail-template'))
          var title = trigger.getAttribute('data-detail-title')
          if (!(template instanceof HTMLTemplateElement) || !title) {
            console.error('Account detail button is missing its title or detail template.', trigger)
            return
          }
          accountDetailTitle.textContent = title
          accountDetailBody.replaceChildren(template.content.cloneNode(true))
          accountDetailDialog.showModal()
        })
      })
      accountDetailClose.addEventListener('click', function () { accountDetailDialog.close() })
      accountDetailDialog.addEventListener('click', function (event) {
        if (event.target === accountDetailDialog) accountDetailDialog.close()
      })
    }
  }
  function toggleTheme() {
    var dark = !isDark()
    applyTheme(dark)
    try { localStorage.setItem('taaffeite-origin-theme', dark ? 'dark' : 'light') } catch (e) {}
  }

  // ---- Customer testimonial carousel ----
  document.querySelectorAll('[data-testimonial-carousel]').forEach(function (carousel) {
    var slides = Array.from(carousel.querySelectorAll('[data-testimonial-slide]'))
    var dots = Array.from(carousel.parentElement.querySelectorAll('[data-testimonial-dot]'))
    var previous = carousel.querySelector('[data-testimonial-prev]')
    var next = carousel.querySelector('[data-testimonial-next]')
    if (!slides.length || slides.length !== dots.length || !previous || !next) {
      console.error('Testimonial carousel slides, dots and controls must be complete.', carousel)
      return
    }

    var current = 0
    function showSlide(index) {
      current = (index + slides.length) % slides.length
      slides.forEach(function (slide, slideIndex) { slide.hidden = slideIndex !== current })
      dots.forEach(function (dot, dotIndex) {
        if (dotIndex === current) dot.setAttribute('aria-current', 'true')
        else dot.removeAttribute('aria-current')
      })
    }

    previous.addEventListener('click', function () { showSlide(current - 1) })
    next.addEventListener('click', function () { showSlide(current + 1) })
    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () { showSlide(index) })
    })
  })

  // ---- Private collection preview ----
  var privateVault = document.querySelector('[data-private-vault]')
  if (privateVault) {
    var privateVaultLabel = privateVault.querySelector('[data-private-vault-label]')
    var privateVaultSummary = privateVault.querySelector('summary')
    var privateVaultClue = privateVault.querySelector('[data-private-vault-clue]')
    var privatePreviewStage = 0

    function updatePrivatePreview(stage) {
      privatePreviewStage = stage
      privateVaultClue.hidden = stage !== 1
      privateVaultLabel.textContent = stage === 0
        ? 'Begin'
        : stage === 1 ? 'Reveal the stone' : 'View the stone'
    }

    if (!privateVaultLabel || !privateVaultSummary || !privateVaultClue) {
      console.error('Private collection preview is missing its interactive elements.', privateVault)
    } else {
      privateVaultSummary.addEventListener('click', function (event) {
        event.preventDefault()
        if (privateVault.classList.contains('is-closing')) return
        if (privateVault.open) {
          privateVault.classList.add('is-closing')
          window.setTimeout(function () {
            privateVault.open = false
            privateVault.classList.remove('is-closing')
            privateVault.classList.add('has-clue')
            updatePrivatePreview(1)
          }, 450)
        } else if (privatePreviewStage === 0) {
          privateVault.classList.add('has-clue')
          updatePrivatePreview(1)
        } else {
          privateVault.classList.remove('has-clue')
          privateVault.open = true
          updatePrivatePreview(2)
        }
      })
      updatePrivatePreview(0)
    }
  }
  // ---- Header height and scrolled state ----
  function publishHeaderHeight() {
    if (!header) return
    var height = Math.ceil(header.getBoundingClientRect().height) + 'px'
    if (site) site.style.setProperty('--sf-header-h', height)
    html.style.setProperty('--sf-header-h', height)
  }
  var menuOpen = false
  var splashVideo = site && site.querySelector('.sf-splash video.sf-splash-media')
  if (splashVideo) {
    var motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    function syncSplashVideo() {
      if (motionPreference.matches) {
        splashVideo.pause()
      } else {
        splashVideo.play().catch(function () {})
      }
    }
    syncSplashVideo()
    if (motionPreference.addEventListener) {
      motionPreference.addEventListener('change', syncSplashVideo)
    } else if (motionPreference.addListener) {
      motionPreference.addListener(syncSplashVideo)
    }
  }
  function updateScrolled() {
    if (!header) return
    var hero = site && site.querySelector('.sf-splash')
    var wasScrolled = header.classList.contains('is-scrolled')
    var scrollThreshold = hero && hero.offsetHeight - header.offsetHeight
    var thresholdBuffer = 48
    var pastHero = hero && (wasScrolled
      ? window.scrollY >= scrollThreshold - thresholdBuffer
      : window.scrollY >= scrollThreshold + thresholdBuffer)
    header.classList.toggle('is-scrolled', Boolean(pastHero) || (!hero && window.scrollY > 8) || menuOpen)
  }
  publishHeaderHeight()
  updateScrolled()
  if (header && 'ResizeObserver' in window) new ResizeObserver(publishHeaderHeight).observe(header)
  window.addEventListener('scroll', updateScrolled, { passive: true })

  // ---- Mobile menu ----
  var menuToggle = document.querySelector('.sf-menu-toggle')
  function setMenu(open) {
    menuOpen = open
    var existing = document.getElementById('sf-mobile-menu')
    if (open && !existing) {
      header.appendChild(document.getElementById('tpl-mobile-menu').content.cloneNode(true))
      document.querySelectorAll('#sf-mobile-menu nav a').forEach(function (link) {
        if (link.getAttribute('href') === here) link.setAttribute('aria-current', 'page')
        else link.removeAttribute('aria-current')
      })
      applyTheme(isDark())
    }
    if (!open && existing) existing.remove()
    header.classList.toggle('is-menu-open', open)
    menuToggle.setAttribute('aria-expanded', String(open))
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    updateScrolled()
  }
  if (menuToggle) menuToggle.addEventListener('click', function () { setMenu(!menuOpen) })

  // ---- Cart drawer ----
  function openCart() {
    if (document.querySelector('.sf-drawer-backdrop')) return
    site.appendChild(document.getElementById('tpl-cart-drawer').content.cloneNode(true))
    var backdrop = document.querySelector('.sf-drawer-backdrop')
    backdrop.querySelectorAll('.sf-cart-item').forEach(function (item, index) {
      var certificateStatus = Array.from(item.querySelectorAll('small'))
        .find(function (small) { return small.textContent.trim() === 'Certificate requested' })
      if (!certificateStatus) return

      var option = document.createElement('label')
      var certificateOption = document.createElement('div')
      var tooltip = document.createElement('span')
      var tooltipButton = document.createElement('button')
      var tooltipContent = document.createElement('span')
      var checkbox = document.createElement('input')
      var copy = document.createElement('span')
      var title = document.createElement('strong')
      var note = document.createElement('small')
      option.className = 'sf-check'
      certificateOption.className = 'sf-cart-certificate-option'
      tooltip.className = 'sf-certificate-tooltip'
      tooltipButton.className = 'sf-certificate-tooltip-trigger'
      tooltipButton.type = 'button'
      tooltipButton.setAttribute('aria-label', 'More information about gemstone certificates')
      tooltipButton.setAttribute('aria-describedby', 'cart-certificate-info-' + index)
      tooltipContent.className = 'sf-certificate-tooltip-content'
      tooltipContent.id = 'cart-certificate-info-' + index
      tooltipContent.setAttribute('role', 'tooltip')
      tooltipContent.textContent = 'All gemstone certificates offered or requested on the platform are authentic local Sri Lankan certificates issued by legally recognised, legitimate gemological testing authorities.'
      var infoIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      infoIcon.setAttribute('viewBox', '0 0 20 20')
      infoIcon.setAttribute('aria-hidden', 'true')
      var infoCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      infoCircle.setAttribute('cx', '10')
      infoCircle.setAttribute('cy', '10')
      infoCircle.setAttribute('r', '8')
      var infoMark = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      infoMark.setAttribute('d', 'M10 9v5m0-8h.01')
      infoIcon.append(infoCircle, infoMark)
      tooltipButton.append(infoIcon)
      tooltip.append(tooltipButton, tooltipContent)
      checkbox.type = 'checkbox'
      checkbox.checked = true
      title.textContent = 'Request a certificate'
      note.textContent = 'Selected by default. Untick if you do not need one.'
      copy.append(title, note)
      option.append(checkbox, copy)
      certificateOption.append(option, tooltip)
      certificateStatus.replaceWith(certificateOption)
    })
    backdrop.addEventListener('mousedown', function (event) { if (event.target === backdrop) closeCart() })
    var close = backdrop.querySelector('.sf-drawer-head button')
    if (close) { close.addEventListener('click', closeCart); close.focus() }
  }
  function closeCart() {
    var backdrop = document.querySelector('.sf-drawer-backdrop')
    if (backdrop) backdrop.remove()
  }
  document.querySelectorAll('.sf-cart-toggle').forEach(function (button) { button.addEventListener('click', openCart) })

  // ---- Product image galleries ----
  document.querySelectorAll('.sf-gallery').forEach(function (gallery) {
    var images = Array.from(gallery.querySelectorAll('.sf-gallery-main > img'))
    var thumbnails = Array.from(gallery.querySelectorAll('.sf-thumbs > button'))
    if (!images.length || images.length !== thumbnails.length) {
      console.error('Product gallery images and thumbnails must have matching entries.', gallery)
      return
    }

    var activeIndex = Math.max(0, images.findIndex(function (image) { return image.classList.contains('is-active') }))
    var main = gallery.querySelector('.sf-gallery-main')
    var zoomButton = gallery.querySelector('.sf-gallery-zoom')
    var lens = document.createElement('div')
    var lensImage = document.createElement('img')
    var zoomEnabled = false
    var pointerX = 0
    var pointerY = 0
    var lensScale = 2.4
    lens.className = 'sf-gallery-lens'
    lens.setAttribute('aria-hidden', 'true')
    lensImage.alt = ''
    lensImage.draggable = false
    lens.appendChild(lensImage)
    main.appendChild(lens)

    function selectImage(index) {
      activeIndex = (index + images.length) % images.length
      images.forEach(function (image, imageIndex) {
        var active = imageIndex === activeIndex
        image.classList.toggle('is-active', active)
        if (active) image.loading = 'eager'
      })
      thumbnails.forEach(function (thumbnail, thumbnailIndex) {
        var active = thumbnailIndex === activeIndex
        thumbnail.classList.toggle('is-active', active)
        thumbnail.setAttribute('aria-pressed', String(active))
      })
      if (zoomEnabled) updateLensImage()
    }

    function updateLensImage() {
      var activeImage = images[activeIndex]
      lensImage.src = activeImage.currentSrc || activeImage.src
      lensImage.style.width = main.clientWidth * lensScale + 'px'
      lensImage.style.height = main.clientHeight * lensScale + 'px'
    }

    function moveLens(event) {
      if (!zoomEnabled) return
      var frame = main.getBoundingClientRect()
      var bounds = lens.getBoundingClientRect()
      pointerX = Math.max(0, Math.min(frame.width, event.clientX - frame.left))
      pointerY = Math.max(0, Math.min(frame.height, event.clientY - frame.top))
      var lensLeft = Math.max(0, Math.min(frame.width - bounds.width, pointerX - bounds.width / 2))
      var lensTop = Math.max(0, Math.min(frame.height - bounds.height, pointerY - bounds.height / 2))
      lens.style.left = lensLeft + 'px'
      lens.style.top = lensTop + 'px'
      lensImage.style.left = bounds.width / 2 - pointerX * lensScale + 'px'
      lensImage.style.top = bounds.height / 2 - pointerY * lensScale + 'px'
      main.classList.add('is-lens-visible')
    }

    function setZoomEnabled(enabled) {
      zoomEnabled = enabled
      main.classList.toggle('is-zoom-enabled', enabled)
      main.classList.remove('is-lens-visible')
      zoomButton.setAttribute('aria-pressed', String(enabled))
      zoomButton.setAttribute('aria-label', enabled ? 'Turn off specimen magnifier' : 'Zoom specimen image')
      if (enabled) updateLensImage()
    }

    gallery.querySelector('.sf-gallery-arrow.previous')?.addEventListener('click', function () {
      selectImage(activeIndex - 1)
    })
    gallery.querySelector('.sf-gallery-arrow.next')?.addEventListener('click', function () {
      selectImage(activeIndex + 1)
    })
    thumbnails.forEach(function (thumbnail, index) {
      thumbnail.addEventListener('click', function () { selectImage(index) })
    })
    zoomButton?.addEventListener('click', function () { setZoomEnabled(!zoomEnabled) })
    main.addEventListener('pointermove', moveLens)
    main.addEventListener('pointerleave', function () { main.classList.remove('is-lens-visible') })
    window.addEventListener('resize', function () {
      if (zoomEnabled) updateLensImage()
    })
  })

  // ---- Clicks handled anywhere on the page ----
  document.addEventListener('click', function (event) {
    var themeButton = event.target.closest('.sf-theme-toggle, .sf-mobile-menu-prefs .sf-text-btn')
    if (themeButton) { toggleTheme(); return }
    var target = event.target.closest('[data-href]')
    if (target) { location.href = target.getAttribute('data-href'); return }
    var link = event.target.closest('a[href]')
    if (link && menuOpen) setMenu(false)
  })
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeCart()
      if (menuOpen) setMenu(false)
      document.querySelectorAll('.sf-gallery-main.is-zoom-enabled').forEach(function (main) {
        var zoomButton = main.querySelector('.sf-gallery-zoom')
        if (zoomButton) zoomButton.click()
      })
    }
  })
  var countryNames = [
    'Afghanistan', 'Albania', 'Algeria', 'American Samoa', 'Andorra', 'Angola', 'Anguilla', 'Antarctica',
    'Antigua and Barbuda', 'Argentina', 'Armenia', 'Aruba', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas',
    'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bermuda', 'Bhutan', 'Bolivia',
    'Bonaire, Sint Eustatius and Saba', 'Bosnia and Herzegovina', 'Botswana', 'Bouvet Island', 'Brazil',
    'British Indian Ocean Territory', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
    'Cameroon', 'Canada', 'Cayman Islands', 'Central African Republic', 'Chad', 'Chile', 'China', 'Christmas Island',
    'Cocos (Keeling) Islands', 'Colombia', 'Comoros', 'Democratic Republic of the Congo',
    'Cook Islands', 'Costa Rica', "Côte d'Ivoire", 'Croatia', 'Cuba', 'Curaçao', 'Cyprus', 'Czechia', 'Denmark',
    'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
    'Estonia', 'Eswatini', 'Ethiopia', 'Falkland Islands', 'Faroe Islands', 'Fiji', 'Finland', 'France',
    'French Guiana', 'French Polynesia', 'French Southern Territories', 'Gabon', 'Gambia', 'Georgia', 'Germany',
    'Ghana', 'Gibraltar', 'Greece', 'Greenland', 'Grenada', 'Guadeloupe', 'Guam', 'Guatemala', 'Guernsey', 'Guinea',
    'Guinea-Bissau', 'Guyana', 'Haiti', 'Heard Island and McDonald Islands', 'Holy See', 'Honduras', 'Hong Kong',
    'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Isle of Man', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jersey', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macao',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Martinique', 'Mauritania',
    'Mauritius', 'Mayotte', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Montserrat',
    'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Caledonia', 'New Zealand',
    'Nicaragua', 'Niger', 'Nigeria', 'Niue', 'Norfolk Island', 'North Korea', 'North Macedonia',
    'Northern Mariana Islands', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea',
    'Paraguay', 'Peru', 'Philippines', 'Pitcairn Islands', 'Poland', 'Portugal', 'Puerto Rico', 'Qatar', 'Réunion',
    'Romania', 'Russia', 'Rwanda', 'Saint Barthélemy', 'Saint Helena, Ascension and Tristan da Cunha',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Martin', 'Saint Pierre and Miquelon',
    'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'São Tomé and Príncipe', 'Saudi Arabia', 'Senegal',
    'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Sint Maarten', 'Slovakia', 'Slovenia', 'Solomon Islands',
    'Somalia', 'South Africa', 'South Georgia and the South Sandwich Islands', 'South Korea', 'South Sudan', 'Spain',
    'Sri Lanka', 'Sudan', 'Suriname', 'Svalbard and Jan Mayen', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
    'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tokelau', 'Tonga', 'Trinidad and Tobago', 'Tunisia',
    'Türkiye', 'Turkmenistan', 'Turks and Caicos Islands', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
    'United Kingdom', 'United States', 'United States Minor Outlying Islands', 'Uruguay', 'Uzbekistan', 'Vanuatu',
    'Venezuela', 'Vietnam', 'Virgin Islands (British)', 'Virgin Islands (U.S.)', 'Wallis and Futuna',
    'Western Sahara', 'Yemen', 'Zambia', 'Zimbabwe', 'Åland Islands', 'Republic of the Congo'
  ]
  countryNames.sort(function (a, b) { return a.localeCompare(b) })
  document.querySelectorAll('[data-country-picker]').forEach(function (picker) {
    var input = picker.querySelector('input[role="combobox"]')
    var listbox = picker.querySelector('[role="listbox"]')
    if (!input || !listbox) {
      console.error('Country picker is missing its input or country list.', picker)
      return
    }

    var selectedCountry = countryNames.find(function (country) {
      return country.toLocaleLowerCase() === input.value.trim().toLocaleLowerCase()
    }) || ''
    var filteredCountries = []
    var activeIndex = -1
    var isOpen = false

    function normalizeCountryText(value) {
      return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
    }

    function renderCountryOptions(query) {
      var normalizedQuery = normalizeCountryText(query.trim())
      filteredCountries = countryNames.filter(function (country) {
        return normalizeCountryText(country).includes(normalizedQuery)
      })
      listbox.replaceChildren()
      input.removeAttribute('aria-activedescendant')
      if (!filteredCountries.length) {
        var empty = document.createElement('div')
        empty.className = 'country-picker-empty'
        empty.textContent = 'No countries found.'
        empty.setAttribute('role', 'status')
        listbox.append(empty)
        activeIndex = -1
        return
      }

      filteredCountries.forEach(function (country, index) {
        var option = document.createElement('div')
        option.className = 'country-picker-option'
        option.id = input.id + '-option-' + countryNames.indexOf(country)
        option.setAttribute('role', 'option')
        option.setAttribute('aria-selected', String(country === selectedCountry))
        if (index === activeIndex) {
          option.classList.add('is-active')
          input.setAttribute('aria-activedescendant', option.id)
        }
        option.textContent = country
        option.addEventListener('pointerdown', function (event) { event.preventDefault() })
        option.addEventListener('click', function () {
          selectedCountry = country
          input.value = country
          input.setCustomValidity('')
          closeCountryOptions()
        })
        listbox.append(option)
      })
    }

    function openCountryOptions(showAll) {
      isOpen = true
      listbox.hidden = false
      input.setAttribute('aria-expanded', 'true')
      activeIndex = -1
      renderCountryOptions(showAll || input.value === selectedCountry ? '' : input.value)
    }

    function closeCountryOptions(restoreSelection) {
      if (restoreSelection && input.value !== selectedCountry) input.value = selectedCountry
      if (input.value === selectedCountry) input.setCustomValidity('')
      isOpen = false
      listbox.hidden = true
      input.setAttribute('aria-expanded', 'false')
      input.removeAttribute('aria-activedescendant')
      activeIndex = -1
    }

    function moveActiveOption(direction) {
      if (!filteredCountries.length) return
      if (activeIndex < 0) activeIndex = direction > 0 ? 0 : filteredCountries.length - 1
      else activeIndex = (activeIndex + direction + filteredCountries.length) % filteredCountries.length
      renderCountryOptions(input.value === selectedCountry ? '' : input.value)
      var activeOption = listbox.querySelector('.is-active')
      if (activeOption) activeOption.scrollIntoView({ block: 'nearest' })
    }

    input.addEventListener('focus', function () {
      input.select()
      openCountryOptions(true)
    })
    input.addEventListener('click', function () {
      if (!isOpen) openCountryOptions(true)
    })
    input.addEventListener('input', function () {
      input.setCustomValidity(
        input.value.trim() && normalizeCountryText(input.value.trim()) !== normalizeCountryText(selectedCountry)
          ? 'Choose a country from the dropdown.'
          : ''
      )
      if (!isOpen) openCountryOptions(false)
      else {
        activeIndex = -1
        renderCountryOptions(input.value)
      }
    })
    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        if (!isOpen) openCountryOptions(true)
        moveActiveOption(event.key === 'ArrowDown' ? 1 : -1)
      } else if (event.key === 'Enter' && isOpen) {
        event.preventDefault()
        if (activeIndex < 0 && filteredCountries.length) {
          var exactMatch = filteredCountries.find(function (country) {
            return normalizeCountryText(country) === normalizeCountryText(input.value.trim())
          })
          selectedCountry = exactMatch || filteredCountries[0]
        } else if (activeIndex >= 0) {
          selectedCountry = filteredCountries[activeIndex]
        }
        if (selectedCountry) {
          input.value = selectedCountry
          input.setCustomValidity('')
          closeCountryOptions()
        }
      } else if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        event.stopPropagation()
        closeCountryOptions(true)
      }
    })
    input.addEventListener('blur', function () {
      window.setTimeout(function () { closeCountryOptions(true) }, 0)
    })
    document.addEventListener('pointerdown', function (event) {
      if (!picker.contains(event.target)) closeCountryOptions(true)
    })
  })

  var privateApplicationForm = document.querySelector('.vault-form')
  if (privateApplicationForm) {
    var applicationProgressLabel = document.querySelector('[data-application-step-label]')
    var applicationProgressBar = document.querySelector('[data-application-progress-bar]')
    var applicationProgressFill = document.querySelector('[data-application-progress-fill]')
    var applicationSuccess = privateApplicationForm.querySelector('[data-application-success]')
    var originalApplicationPanels = Array.from(privateApplicationForm.querySelectorAll('[data-application-panel]'))
    var reviewPanel = originalApplicationPanels[originalApplicationPanels.length - 1]
    var questionFields = []
    originalApplicationPanels.slice(0, -1).forEach(function (panel) {
      questionFields = questionFields.concat(Array.from(panel.querySelectorAll('.vault-field')))
      panel.remove()
    })

    if (!questionFields.length || !reviewPanel || !applicationProgressLabel || !applicationProgressBar || !applicationProgressFill || !applicationSuccess) {
      console.error('Private collection application questions are incomplete.', privateApplicationForm)
    } else {
      var applicationQuestions = {
        applicantType: 'Who is applying?',
        fullName: 'What is your full name?',
        email: 'Where should we email you?',
        phone: 'What number can we reach you at?',
        country: 'Which country are you in?',
        occupation: 'What is your occupation or industry?',
        purpose: 'Why are you interested in private access?',
        gemstoneInterest: 'Which gemstones interest you?',
        interestDetails: 'What are you hoping to find?',
        collectionGoal: 'What are your collecting goals?',
        contactPreference: 'How should we contact you?',
        collectionNotes: 'Anything else to share?'
      }
      var questionPanels = []
      var questionFragment = document.createDocumentFragment()

      questionFields.forEach(function (field, index) {
        var control = field.querySelector('input, select, textarea')
        var questionPanel = document.createElement('section')
        var heading = document.createElement('h2')
        var actions = document.createElement('div')
        var nextButton = document.createElement('button')
        var fieldName = control && control.name

        questionPanel.className = 'vault-step-panel vault-question-panel'
        questionPanel.setAttribute('data-application-panel', String(index))
        questionPanel.setAttribute('aria-labelledby', 'private-question-title-' + index)
        heading.id = 'private-question-title-' + index
        heading.tabIndex = -1
        heading.textContent = applicationQuestions[fieldName] || 'Your details'
        var fieldLabel = field.querySelector('.country-picker-label') || field.querySelector('span')
        if (fieldLabel) fieldLabel.classList.add('sf-visually-hidden')
        field.classList.add('vault-question-field')
        questionPanel.appendChild(heading)
        questionPanel.appendChild(field)

        actions.className = 'vault-form-actions'
        if (index > 0) {
          var previousButton = document.createElement('button')
          previousButton.className = 'vault-button is-secondary'
          previousButton.type = 'button'
          previousButton.setAttribute('data-application-previous', '')
          previousButton.textContent = 'Back'
          actions.appendChild(previousButton)
        }
        nextButton.className = 'vault-button is-primary'
        nextButton.type = 'button'
        nextButton.setAttribute('data-application-next', '')
        nextButton.textContent = 'Continue'
        actions.appendChild(nextButton)
        questionPanel.appendChild(actions)
        questionFragment.appendChild(questionPanel)
        questionPanels.push(questionPanel)
      })

      reviewPanel.setAttribute('data-application-panel', String(questionPanels.length))
      privateApplicationForm.insertBefore(questionFragment, reviewPanel)
      var applicationStepPanels = questionPanels.concat([reviewPanel])
      var reviewStepIndex = questionPanels.length
      var currentApplicationStep = 0

      function updateApplicationProgress(index) {
        var reviewing = index === reviewStepIndex
        var progress = reviewing ? 100 : Math.round(index / reviewStepIndex * 100)
        applicationProgressLabel.textContent = reviewing
          ? 'Review your answers'
          : 'Question ' + (index + 1) + ' of ' + reviewStepIndex
        applicationProgressBar.setAttribute('aria-valuenow', String(progress))
        applicationProgressBar.setAttribute('aria-valuetext', reviewing
          ? 'Review your answers'
          : 'Question ' + (index + 1) + ' of ' + reviewStepIndex)
        applicationProgressFill.style.width = progress + '%'
      }

      function updateApplicationReview() {
        privateApplicationForm.querySelectorAll('[data-review-value]').forEach(function (summary) {
          var field = privateApplicationForm.elements.namedItem(summary.getAttribute('data-review-value'))
          if (!field) {
            console.error('Application review field is missing.', summary)
            return
          }
          var value = field.value
          if (field.tagName === 'SELECT') {
            value = field.selectedOptions.length && field.value ? field.selectedOptions[0].textContent : ''
          }
          summary.textContent = value.trim() || 'Not provided'
        })
      }

      function showApplicationStep(index, moveFocus) {
        if (index < 0 || index >= applicationStepPanels.length) return
        currentApplicationStep = index
        applicationStepPanels.forEach(function (panel, panelIndex) {
          panel.hidden = panelIndex !== index
        })
        updateApplicationProgress(index)
        if (index === reviewStepIndex) updateApplicationReview()
        if (moveFocus) {
          var heading = applicationStepPanels[index].querySelector('h2')
          if (heading) heading.focus()
        }
      }

      function validateApplicationPanel(panelIndex) {
        var panel = applicationStepPanels[panelIndex]
        var invalidField = Array.from(panel.querySelectorAll('input, select, textarea'))
          .find(function (field) { return !field.checkValidity() })
        if (!invalidField) return true
        showApplicationStep(panelIndex, false)
        invalidField.reportValidity()
        return false
      }

      function completeApplication() {
        for (var panelIndex = 0; panelIndex < applicationStepPanels.length; panelIndex += 1) {
          if (!validateApplicationPanel(panelIndex)) return
        }
        applicationStepPanels.forEach(function (panel) { panel.hidden = true })
        applicationSuccess.hidden = false
        updateApplicationProgress(reviewStepIndex)
        applicationProgressLabel.textContent = 'Complete'
        applicationStepPanels.forEach(function (panel) {
          panel.querySelectorAll('[data-application-previous], [data-application-next]').forEach(function (button) {
            button.disabled = true
          })
        })
        var successHeading = applicationSuccess.querySelector('h2')
        if (successHeading) successHeading.focus()
      }

      privateApplicationForm.querySelectorAll('[data-application-next]').forEach(function (button) {
        button.addEventListener('click', function () {
          if (validateApplicationPanel(currentApplicationStep)) {
            showApplicationStep(currentApplicationStep + 1, true)
          }
        })
      })
      privateApplicationForm.querySelectorAll('[data-application-previous]').forEach(function (button) {
        button.addEventListener('click', function () {
          showApplicationStep(currentApplicationStep - 1, true)
        })
      })
      privateApplicationForm.addEventListener('submit', function (event) {
        event.preventDefault()
        if (currentApplicationStep < reviewStepIndex) {
          if (validateApplicationPanel(currentApplicationStep)) showApplicationStep(currentApplicationStep + 1, true)
          return
        }
        completeApplication()
      })
      showApplicationStep(0, false)
    }
  }
  var checkoutDeliverySelect = document.querySelector('#checkout-delivery-service')
  var checkoutDeliveryOptions = Array.from(document.querySelectorAll('input[name="checkoutDeliverySummary"]'))
  if (checkoutDeliverySelect && checkoutDeliveryOptions.length) {
    function syncCheckoutDeliveryOptions() {
      checkoutDeliveryOptions.forEach(function (option) {
        option.checked = option.value === checkoutDeliverySelect.value
      })
    }
    checkoutDeliveryOptions.forEach(function (option) {
      option.addEventListener('change', function () {
        if (!option.checked) return
        checkoutDeliverySelect.value = option.value
        checkoutDeliverySelect.dispatchEvent(new Event('change', { bubbles: true }))
      })
    })
    checkoutDeliverySelect.addEventListener('change', syncCheckoutDeliveryOptions)
    syncCheckoutDeliveryOptions()
  }
  // Forms are for show only.
  document.addEventListener('submit', function (event) { event.preventDefault() })
  var profileDetailsForm = document.querySelector('[data-profile-details-form]')
  if (profileDetailsForm) {
    var profileEditButton = document.querySelector('[data-profile-edit]')
    var profileCancelButton = profileDetailsForm.querySelector('[data-profile-cancel]')
    var profileActions = profileDetailsForm.querySelector('[data-profile-actions]')
    var profileStatus = profileDetailsForm.querySelector('[data-profile-status]')
    var profileInputs = Array.from(profileDetailsForm.querySelectorAll('[data-profile-input]'))

    function setProfileEditing(editing) {
      profileEditButton.hidden = editing
      profileActions.hidden = !editing
      profileInputs.forEach(function (input) {
        var display = profileDetailsForm.querySelector('[data-profile-display="' + input.dataset.profileInput + '"]')
        input.hidden = !editing
        display.hidden = editing
      })
    }

    profileEditButton.addEventListener('click', function () {
      profileStatus.hidden = true
      setProfileEditing(true)
      profileInputs[0].focus()
    })
    profileCancelButton.addEventListener('click', function () {
      profileInputs.forEach(function (input) {
        var display = profileDetailsForm.querySelector('[data-profile-display="' + input.dataset.profileInput + '"]')
        input.value = display.textContent
      })
      setProfileEditing(false)
      profileStatus.textContent = 'Editing cancelled. Your details were not changed.'
      profileStatus.hidden = false
      profileEditButton.focus()
    })
    profileDetailsForm.addEventListener('submit', function (event) {
      event.preventDefault()
      profileInputs.forEach(function (input) {
        var display = profileDetailsForm.querySelector('[data-profile-display="' + input.dataset.profileInput + '"]')
        display.textContent = input.value.trim()
      })
      var nameDisplay = profileDetailsForm.querySelector('[data-profile-display="name"]')
      var accountName = document.querySelector('.account-menu-toggle > span:nth-child(2)')
      if (accountName) accountName.textContent = nameDisplay.textContent
      setProfileEditing(false)
      profileStatus.textContent = 'Your details were updated in this preview only. They are not saved to an account.'
      profileStatus.hidden = false
      profileEditButton.focus()
    })
  }
  var profileAddressForm = document.querySelector('[data-profile-address-form]')
  if (profileAddressForm) {
    var addressEditButton = document.querySelector('[data-address-edit]')
    var addressCancelButton = profileAddressForm.querySelector('[data-address-cancel]')
    var addressActions = profileAddressForm.querySelector('[data-address-actions]')
    var addressInput = profileAddressForm.querySelector('[data-address-input]')
    var addressDisplay = document.querySelector('[data-address-display]')
    var addressStatus = profileAddressForm.querySelector('[data-address-status]')

    function setAddressEditing(editing) {
      addressEditButton.hidden = editing
      addressDisplay.hidden = editing
      profileAddressForm.hidden = !editing
      addressActions.hidden = !editing
    }

    addressEditButton.addEventListener('click', function () {
      addressStatus.hidden = true
      addressInput.value = addressDisplay.textContent.trim()
      setAddressEditing(true)
      addressInput.focus()
    })
    addressCancelButton.addEventListener('click', function () {
      setAddressEditing(false)
      addressStatus.textContent = 'Editing cancelled. Your address was not changed.'
      addressStatus.hidden = false
      addressEditButton.focus()
    })
    profileAddressForm.addEventListener('submit', function (event) {
      event.preventDefault()
      addressDisplay.textContent = addressInput.value.trim()
      setAddressEditing(false)
      addressStatus.textContent = 'Your address was updated in this preview only. It is not saved to an account.'
      addressStatus.hidden = false
      addressEditButton.focus()
    })
  }
  var newsletterForm = document.querySelector('[data-newsletter-form]')
  if (newsletterForm) {
    var newsletterStatus = newsletterForm.parentElement.querySelector('[data-newsletter-status]')
    newsletterForm.addEventListener('submit', function (event) {
      event.preventDefault()
      newsletterForm.reset()
      newsletterStatus.textContent = 'Thanks for your interest. This preview does not save or send email addresses.'
    })
  }
  var loginForm = document.querySelector('[data-login-form]')
  if (loginForm) {
    var loginName = loginForm.querySelector('[data-login-name]')
    var loginNameLabel = loginForm.querySelector('[data-login-name-label]')
    var loginPassword = loginForm.querySelector('[data-login-password]')
    var loginPasswordLabel = loginForm.querySelector('[data-login-password-label]')
    var loginHeading = loginForm.querySelector('[data-login-heading]')
    var loginDescription = loginForm.querySelector('[data-login-description]')
    var loginHeroHeading = document.querySelector('#demo-login-title')
    var loginHeroDescription = document.querySelector('.demo-login-intro > p:not(.eyebrow)')
    var loginSubmit = loginForm.querySelector('[data-login-submit]')
    var loginPrompt = loginForm.querySelector('[data-login-prompt]')
    var loginToggle = loginForm.querySelector('[data-login-toggle]')
    var loginForgot = loginForm.querySelector('[data-login-forgot]')
    var loginMessage = loginForm.querySelector('[data-login-message]')
    var loginMode = 'create'
    function setLoginMode(mode) {
      loginMode = mode
      var isCreate = mode === 'create'
      var isReset = mode === 'reset'
      loginName.hidden = loginNameLabel.hidden = !isCreate
      loginName.required = isCreate
      loginPassword.hidden = isReset
      loginPasswordLabel.hidden = isReset
      loginPassword.required = !isReset
      loginPassword.autocomplete = isCreate ? 'new-password' : 'current-password'
      loginHeroHeading.firstChild.nodeValue = isCreate ? 'Create your ' : isReset ? 'Reset your ' : 'Welcome '
      loginHeroHeading.querySelector('em').textContent = isCreate ? 'account.' : isReset ? 'password.' : 'back.'
      loginHeroDescription.textContent = isCreate
        ? 'Save your favourites, follow rare finds and keep your collection in one place.'
        : isReset
          ? 'We’ll help you get back into your collector account.'
          : 'Access your collection and account details.'
      loginHeading.textContent = isCreate ? 'Create an account' : isReset ? 'Reset your password' : 'Welcome back'
      loginDescription.textContent = isCreate
        ? 'Enter your details to get started.'
        : isReset
          ? 'Enter your email address to receive a reset link.'
          : 'Sign in to continue to your collector account.'
      loginSubmit.textContent = isCreate ? 'Create account' : isReset ? 'Send reset link' : 'Sign in'
      loginPrompt.textContent = isCreate ? 'Already have an account?' : isReset ? 'Remembered your password?' : 'New to Taaffeite Origin?'
      loginToggle.textContent = isCreate ? 'Sign in' : isReset ? 'Sign in' : 'Create an account'
      loginForgot.hidden = isCreate || isReset
      loginMessage.hidden = true
    }
    loginToggle.addEventListener('click', function () {
      setLoginMode(loginMode === 'create' ? 'signin' : loginMode === 'reset' ? 'signin' : 'create')
    })
    loginForgot.addEventListener('click', function () {
      setLoginMode(loginMode === 'reset' ? 'signin' : 'reset')
    })
    loginForm.addEventListener('submit', function () {
      loginMessage.textContent = loginMode === 'reset'
        ? 'Password reset is not connected in this static showcase.'
        : 'This is a static showcase. Account sign-in and registration are not connected.'
      loginMessage.hidden = false
    })
  }

  // ---- Editorial fade-up on scroll ----
  var targets = document.querySelectorAll('[data-reveal]:not(.is-revealed)')
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    targets.forEach(function (target) { target.classList.add('is-revealed') })
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    targets.forEach(function (target) { observer.observe(target) })
  }
})()
