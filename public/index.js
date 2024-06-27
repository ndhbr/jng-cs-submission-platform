(function () {
    // Modal
    var modal = document.getElementById('upload-form');
    var span = document.getElementsByClassName('close')[0];

    span.onclick = function () {
        modal.style.display = 'none';
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    // Get groups and submission dates
    var xhr = new XMLHttpRequest();
    var url = '/groups';
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const infos = JSON.parse(xhr.responseText);
            const lastSubmissionDate = infos.submission_date;
            const classes = infos.classes;

            // set last submission date
            const domLastSubmissionDate = document.querySelector('#last-submission-date');
            domLastSubmissionDate.innerHTML = new Date(
                lastSubmissionDate).toLocaleString('de-DE') + ' Uhr';

            // set groups
            const domGroups = document.querySelector('#groups');

            domGroups.innerHTML = '';
            for (const classObj of classes) {
                domGroups.innerHTML += `<h2>Klasse ${classObj.id.toUpperCase()}</h2>`;
                const groups = classObj.groups;

                for (const group of groups) {
                    const lastSubmissionTimestamp = Date.parse(group.last_submission);
                    const lastSubmissionDate = (!isNaN(lastSubmissionTimestamp)) ? new Date(lastSubmissionTimestamp) : null;

                    domGroups.innerHTML += `
                    <div class="group-element">
                        <p>
                            <b>${group.name}</b><br />
                            <small>Hochgeladen am: ${lastSubmissionDate ? lastSubmissionDate.toLocaleString('de-DE') + ' Uhr' : '-'}</small>
                        </p>
                    
                        <div class="group-element-buttons">
                            <button class="button button-outlined open-modal" data-content="${group.id}">
                                + Hochladen
                            </button>
                            <a href="${group.url}" target="_blank">
                                <button class="button" ${(group.url.length == 0) ? 'disabled' : null}>
                                    > Ansehen
                                </button>
                            </a>
                        </div>
                    </div>
                    `;
                }
            }

            // open modal
            document.querySelectorAll('.open-modal').forEach(button => {
                button.addEventListener('click', function () {
                    const groupId = this.getAttribute('data-content');
                    openModal(groupId);
                });
            });
        }
    };
    xhr.send();

    // Open modal   
    function openModal(groupId) {
        const modal = document.getElementById('upload-form');
        const domGroupName = document.getElementById('modal-group-name');
        const domId = document.getElementById('id');

        domGroupName.innerHTML = groupId;
        domId.value = groupId;

        modal.style.display = 'block';
    }

    // Query Params for Alerts
    const domAlert = document.getElementById('alertbox');
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('msg');
    const type = urlParams.get('type') ?? 'success';

    if (message != null && message.length > 0) {
        switch (type) {
            case 'success':
                domAlert.classList.add('alert-success');
                break;
            case 'warning':
                domAlert.classList.add('alert-warning');
                break;
        }

        domAlert.innerHTML = message;
    }
})();