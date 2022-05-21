const CAPTION_XPATH = "/html/body/div[1]/c-wiz/div[1]/div/div[9]/div[3]/div[7]/div[1]/div[1]"
const CAPTION_SELECTOR = "c-wiz div[jsname='dsyhDe']"
const CAPTION_BUTTON_XPATH = "/html/body/div[1]/c-wiz/div[1]/div/div[9]/div[3]/div[10]/div[2]/div/div[3]/span/button/div[1]"
const CAPTION_BUTTON_SELECTOR = "c-wiz div[j-sname='s3Eaab']"
const VIDEO_XPATH = "/html/body/div[1]/c-wiz/div[1]/div/div[9]/div[3]/div[2]/div[1]"
// const VIDEO_SELECTOR = "c-wiz div[jsname='Nl0j0e']"
const VIDEO_SELECTOR = "c-wiz div[jsname='E2KThb']"
const MEETING_SELECTOR = "c-wiz" // Doesn't work

const $xp = xp => {
  const snapshot = document.evaluate(
    xp, document, null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
  )

  return (snapshot.snapshotLength) ? snapshot.snapshotItem(0) : null
}


;(() => {
  let APP = {
    captions_on: false,
    // observing_captions: false,
    meeting_observer: new MutationObserver(function(mutationsList, observer) {
      if (APP.in_meeting()) {
        console.log("in a meeting")
        document.querySelector(CAPTION_SELECTOR).style.visibility = 'hidden'
        // APP.caption_observer.observe($xp(CAPTION_XPATH), {subtree:true, characterData:true, attributes:true}) // add attributes:true later if need be.
        APP.caption_observer.observe(document.querySelector(CAPTION_SELECTOR), {subtree:true, characterData:true, attributes:true}) // add attributes:true later if need be.
      } else {
        console.log("not in a meeting")
        APP.caption_observer.disconnect();
        // hide any given captions if captions_on?
      }
    }),
    caption_observer: new MutationObserver(function(mutationsList, observer) {
      // const caption_elems = $xp(CAPTION_XPATH).children
      const caption_elems = document.querySelector(CAPTION_SELECTOR).children
      const video_elems = APP.get_videos()
      const prev_captions_on = APP.captions_on

      let captions_on = caption_elems && caption_elems.length

      let captions = {} // we'll add as "img_url": "text" since img url is identifiable

      if (prev_captions_on && !captions_on) { // captions turned off
        for (let {name, video_element} of Object.values(video_elems)) {
          // video_element.querySelector(`#${name.replaceAll(' ', '\\ ')}_captions`).remove()
          video_element.querySelector(`.smart_captions`).remove()
        }
      } else if (!prev_captions_on && captions_on) { // captions turned on
        console.log("making captions_location", Object.values(video_elems))
        for (let {name, video_element} of Object.values(video_elems)) {
          const caption_div = document.createElement('div')
          // caption_div.id = `${name}_captions`
          caption_div.className = caption_div.className + " smart_captions"
          caption_div.style.position = 'fixed'
          caption_div.style.bottom = '0'
          caption_div.style.zIndex = '10000000'
          caption_div.style.backgroundColor = "rgba(0, 0, 0, 0.65)"
          caption_div.style.borderRadius = "2rem"
          video_element.querySelector("div[jsname='Nl0j0e']").prepend(caption_div)
          console.log("THIS IS IMPORTANT", video_element)
        }
        // kill all caption elements
      }

      for (let caption_elem of caption_elems) {
        captions_on = true
        // console.log(caption.innerHTML)
        let [name_elem, content_elem] = caption_elem.querySelectorAll("div")
        let name = name_elem.textContent // not needed: use identifying image source! (for people who have the same name)
        if (name.endsWith(" (Presentation)")) {
          name = name.slice(0, name.lastIndexOf(" (Presentation)"))
        }
        let caption_content = content_elem.textContent
        let img_src = caption_elem.querySelector('img').src

        img_src = img_src.slice(0,img_src.indexOf("="))

        console.log("CAPTION ", name, ":", caption_content)
        console.log(caption_elem)
        console.log(img_src)
        captions[JSON.stringify({img_src, name})] = {name, caption_content, caption_elem}
      }

      // add captions to all video elements
      for (const [key, {name, caption_content, caption_elem}] of Object.entries(captions)) {
        const res = video_elems[key]
        // console.log("res", res)
        // console.log(key )
        if (res) {
          let {_, video_element} = res
          console.log(video_element, caption_elem)
          // let caption_holder_div = video_element.querySelector(`div#${name.replaceAll(' ', '\\ ')}_captions`)
          caption_holder_div = video_element.querySelector("div.smart_captions")
          // caption_holder_div.firstChild().remove()
          try {
            caption_holder_div.replaceChildren(caption_elem.cloneNode(true))
          } catch (error) {
          const caption_div = document.createElement('div')
          // caption_div.id = `${name}_captions`
          caption_div.className = caption_div.className + " smart_captions"
          caption_div.style.position = 'fixed'
          caption_div.style.bottom = '0'
          caption_div.style.zIndex = '10000000'
          caption_div.style.backgroundColor = "rgba(0, 0, 0, 0.65)"
          caption_div.style.borderRadius = "2rem"
          video_element.querySelector("div[jsname='Nl0j0e']").prepend(caption_div)

          caption_div.replaceChildren(caption_elem.cloneNode(true))
          }
        }
      }

      APP.captions_on = captions_on
    }),
    init: () => {
      APP.meeting_observer.observe(document.querySelector(MEETING_SELECTOR), {attributes:true, childList:true})
    },
    in_meeting: () => {
      // return $xp(CAPTION_BUTTON_XPATH) !== null
      return document.querySelector(VIDEO_SELECTOR) !== null
    },
    get_videos: () => {
      /*
      const img_elements = Array.from($xp(VIDEO_XPATH).querySelectorAll("img"))
      let video_elements = img_elements.map((el) => el.parentElement.parentElement.parentElement)
      */
      const video_elements = Array.from(document.querySelectorAll(VIDEO_SELECTOR))
      const img_elements = video_elements.map((el) => el.querySelector("img"))
      let video_names = video_elements.map(el => {
        const name_element = el.querySelector('[data-self-name="You"]') // This seems like a bug that might get patched in the future
        let name = (name_element) ? name_element.innerText : "You"
        if (name.endsWith(" (Presentation)")) {
          name = name.slice(0, name.lastIndexOf(" (Presentation)"))
        }
        return name
      })

      let img_urls = img_elements.map(el => {
        let img_src = el.src
        return img_src.slice(0,img_src.indexOf("="))
      })
      const videos = {}
      for (let i = 0; i < video_elements.length; i++) {
        videos[JSON.stringify({img_src:img_urls[i], name:video_names[i]})] = {name:video_names[i], video_element:video_elements[i]}
      }
      // console.log("VIDEOS", videos)
      return videos;
    }
  }

  console.log("About to start init")
  APP.init()
})()