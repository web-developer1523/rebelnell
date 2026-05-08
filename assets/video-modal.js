import '@archetype-themes/scripts/config';
import '@archetype-themes/scripts/helpers/library-loader';
import '@archetype-themes/scripts/modules/modal';
import '@archetype-themes/scripts/helpers/youtube';
import '@archetype-themes/scripts/helpers/vimeo';

// Video modal will auto-initialize for any anchor link that points to YouTube
// MP4 videos must manually be enabled with:
//   - .product-video-trigger--mp4 (trigger button)
//   - .product-video-mp4-sound video player element (cloned into modal)
//     - see media.liquid for example of this
theme.videoModal = function() {
  var youtubePlayer;
  var vimeoPlayer;

  var videoHolderId = 'VideoHolder';
  var selectors = {
    youtube: 'a[href*="youtube.com/watch"], a[href*="youtu.be/"]',
    vimeo: 'a[href*="player.vimeo.com/player/"], a[href*="vimeo.com/"]',
    mp4Trigger: '.product-video-trigger--mp4',
    mp4Player: '.product-video-mp4-sound'
  };

  var youtubeTriggers = document.querySelectorAll(selectors.youtube);
  var vimeoTriggers = document.querySelectorAll(selectors.vimeo);
  var mp4Triggers = document.querySelectorAll(selectors.mp4Trigger);

  if (!youtubeTriggers.length && !vimeoTriggers.length && !mp4Triggers.length) {
    return;
  }

  var videoHolderDiv = document.getElementById(videoHolderId);

  if (youtubeTriggers.length) {
    theme.LibraryLoader.load('youtubeSdk');
  }

  if (vimeoTriggers.length) {
    theme.LibraryLoader.load('vimeo', window.vimeoApiReady);
  }

  var modal = new theme.Modals('VideoModal', 'video-modal', {
    closeOffContentClick: true,
    bodyOpenClass: ['modal-open', 'video-modal-open'],
    solid: true
  });

  youtubeTriggers.forEach(btn => {
    btn.addEventListener('click', triggerYouTubeModal);
  });

  vimeoTriggers.forEach(btn => {
    btn.addEventListener('click', triggerVimeoModal);
  });

  mp4Triggers.forEach(btn => {
    btn.addEventListener('click', triggerMp4Modal);
  });

  document.addEventListener('modalClose.VideoModal', closeVideoModal);

  function triggerYouTubeModal(evt) {
    // If not already loaded, treat as normal link
    if (!theme.config.youTubeReady) {
      return;
    }

    evt.preventDefault();
    emptyVideoHolder();

    modal.open(evt);

    var videoId = getYoutubeVideoId(evt.currentTarget.getAttribute('href'));
    youtubePlayer = new theme.YouTube(
      videoHolderId,
      {
        videoId: videoId,
        style: 'sound',
        events: {
          onReady: onYoutubeReady
        }
      }
    );
  }

  function triggerVimeoModal(evt) {
    // If not already loaded, treat as normal link
    if (!theme.config.vimeoReady) {
      return;
    }

    evt.preventDefault();
    emptyVideoHolder();

    modal.open(evt);

    var videoId = evt.currentTarget.dataset.videoId;
    var videoLoop = evt.currentTarget.dataset.videoLoop;
    vimeoPlayer = new theme.VimeoPlayer(
      videoHolderId,
      videoId,
      {
        style: 'sound',
        loop: videoLoop,
      }
    );
  }

  function triggerMp4Modal(evt) {
    emptyVideoHolder();

    var el = evt.currentTarget;
    var player = el.parentNode.querySelector(selectors.mp4Player);

    // Clone video element and place it in the modal
    var playerClone = player.cloneNode(true);
    playerClone.classList.remove('hide');

    videoHolderDiv.append(playerClone);
    modal.open(evt);

    // Play new video element
    videoHolderDiv.querySelector('video').play();
  }

  function onYoutubeReady(evt) {
    evt.target.unMute();
    evt.target.playVideo();
  }

  function getYoutubeVideoId(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
  }

  function emptyVideoHolder() {
    videoHolderDiv.innerHTML = '';
  }

  function closeVideoModal() {
    if (youtubePlayer && typeof youtubePlayer.destroy === 'function') {
      youtubePlayer.destroy();
    } else if (vimeoPlayer && typeof vimeoPlayer.destroy === 'function') {
      vimeoPlayer.destroy();
    } else {
      emptyVideoHolder();
    }
  }
};

